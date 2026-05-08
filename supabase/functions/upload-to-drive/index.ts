// Edge function: upload-to-drive
// Uploads a PDF to Google Drive inside a numbered client folder, under the configured root folder.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_drive/drive/v3";
const UPLOAD_GATEWAY =
  "https://connector-gateway.lovable.dev/google_drive/upload/drive/v3";

// ID of the user's existing "clientes" folder shared at setup time.
const ROOT_FOLDER_ID = "1YRkc3INwpEJra9vbeJF84jv49k7sb7bU";

const FOLDER_MIME = "application/vnd.google-apps.folder";

function authHeaders() {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const driveKey = Deno.env.get("GOOGLE_DRIVE_API_KEY");
  if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");
  if (!driveKey) throw new Error("GOOGLE_DRIVE_API_KEY not configured");
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": driveKey,
  };
}

async function driveJson(path: string, init: RequestInit = {}) {
  const res = await fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: {
      ...authHeaders(),
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Drive API ${res.status}: ${text.slice(0, 500)}`);
  }
  return text ? JSON.parse(text) : {};
}

async function findChildByName(
  parentId: string,
  name: string,
  mimeType?: string,
) {
  const escName = name.replace(/'/g, "\\'");
  let q = `'${parentId}' in parents and name = '${escName}' and trashed = false`;
  if (mimeType) q += ` and mimeType = '${mimeType}'`;
  const data = await driveJson(
    `/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,webViewLink)&pageSize=10`,
  );
  return (data.files || [])[0] || null;
}

async function listChildFolders(parentId: string) {
  const folders: Array<{ id: string; name: string }> = [];
  let pageToken: string | undefined;
  const q = `'${parentId}' in parents and mimeType = '${FOLDER_MIME}' and trashed = false`;
  do {
    const url =
      `/files?q=${encodeURIComponent(q)}&fields=nextPageToken,files(id,name)&pageSize=1000` +
      (pageToken ? `&pageToken=${pageToken}` : "");
    const data = await driveJson(url);
    for (const f of data.files || []) folders.push(f);
    pageToken = data.nextPageToken;
  } while (pageToken);
  return folders;
}

async function createFolder(parentId: string, name: string) {
  return await driveJson(`/files?fields=id,name,webViewLink`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      mimeType: FOLDER_MIME,
      parents: [parentId],
    }),
  });
}

function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.includes(",") ? b64.split(",").pop()! : b64;
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function uploadMultipart(
  parentId: string,
  fileName: string,
  bytes: Uint8Array,
) {
  const boundary = "----xplo" + crypto.randomUUID().replace(/-/g, "");
  const metadata = JSON.stringify({
    name: fileName,
    parents: [parentId],
    mimeType: "application/pdf",
  });

  const enc = new TextEncoder();
  const head = enc.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
      `--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`,
  );
  const tail = enc.encode(`\r\n--${boundary}--`);

  const body = new Uint8Array(head.length + bytes.length + tail.length);
  body.set(head, 0);
  body.set(bytes, head.length);
  body.set(tail, head.length + bytes.length);

  const res = await fetch(
    `${UPLOAD_GATEWAY}/files?uploadType=multipart&fields=id,name,webViewLink`,
    {
      method: "POST",
      headers: {
        ...authHeaders(),
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );
  const text = await res.text();
  if (!res.ok)
    throw new Error(`Drive upload ${res.status}: ${text.slice(0, 500)}`);
  return JSON.parse(text);
}

async function updateFileContent(fileId: string, bytes: Uint8Array) {
  const res = await fetch(
    `${UPLOAD_GATEWAY}/files/${fileId}?uploadType=media&fields=id,name,webViewLink`,
    {
      method: "PATCH",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/pdf",
      },
      body: bytes,
    },
  );
  const text = await res.text();
  if (!res.ok)
    throw new Error(`Drive update ${res.status}: ${text.slice(0, 500)}`);
  return JSON.parse(text);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    // Validate user (using anon-style check via the user-scoped client)
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userRes } = await userClient.auth.getUser();
    if (!userRes?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { clientId, fileName, pdfBase64 } = body || {};
    if (!clientId || !fileName || !pdfBase64) {
      return new Response(
        JSON.stringify({ error: "clientId, fileName, pdfBase64 required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get client name
    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .select("id, name")
      .eq("id", clientId)
      .maybeSingle();
    if (clientErr || !client) {
      return new Response(JSON.stringify({ error: "Client not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get or create folder mapping
    const { data: existingFolder } = await supabase
      .from("client_drive_folders")
      .select("*")
      .eq("client_id", clientId)
      .maybeSingle();

    let folderId: string;
    let folderName: string;
    let folderUrl: string | null = null;
    let clientNumber: number | null = null;

    if (existingFolder?.drive_folder_id) {
      // Verify folder still exists in Drive
      try {
        const meta = await driveJson(
          `/files/${existingFolder.drive_folder_id}?fields=id,name,webViewLink,trashed`,
        );
        if (meta.trashed) throw new Error("trashed");
        folderId = meta.id;
        folderName = meta.name;
        folderUrl = meta.webViewLink || existingFolder.drive_folder_url;
        clientNumber = existingFolder.client_number;
      } catch {
        // Folder vanished — recreate
        const created = await createNumberedFolder(client.name);
        folderId = created.id;
        folderName = created.name;
        folderUrl = created.webViewLink;
        clientNumber = created.number;
        await supabase
          .from("client_drive_folders")
          .update({
            drive_folder_id: folderId,
            drive_folder_name: folderName,
            drive_folder_url: folderUrl,
            client_number: clientNumber,
          })
          .eq("client_id", clientId);
      }
    } else {
      const created = await createNumberedFolder(client.name);
      folderId = created.id;
      folderName = created.name;
      folderUrl = created.webViewLink;
      clientNumber = created.number;
      await supabase.from("client_drive_folders").insert({
        client_id: clientId,
        drive_folder_id: folderId,
        drive_folder_name: folderName,
        drive_folder_url: folderUrl,
        client_number: clientNumber,
      });
    }

    // Upload or update file
    const bytes = base64ToBytes(pdfBase64);
    const safeName = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;

    const existing = await findChildByName(folderId, safeName);
    let result;
    if (existing) {
      result = await updateFileContent(existing.id, bytes);
    } else {
      result = await uploadMultipart(folderId, safeName, bytes);
    }

    return new Response(
      JSON.stringify({
        fileId: result.id,
        fileName: result.name,
        webViewLink: result.webViewLink,
        folderId,
        folderName,
        folderUrl,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("upload-to-drive error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function createNumberedFolder(clientName: string) {
  const folders = await listChildFolders(ROOT_FOLDER_ID);
  let maxNum = 0;
  const re = /^\s*(\d+)\s*-\s*/;
  for (const f of folders) {
    const m = re.exec(f.name);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!isNaN(n) && n > maxNum) maxNum = n;
    }
  }
  const next = maxNum + 1;
  const name = `${next} - ${clientName}`;
  const created = await createFolder(ROOT_FOLDER_ID, name);
  return {
    id: created.id as string,
    name: created.name as string,
    webViewLink: (created.webViewLink as string) || null,
    number: next,
  };
}
