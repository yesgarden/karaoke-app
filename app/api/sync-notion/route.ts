import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type NotionProperty = any;

type NotionPage = {
    id: string;
    properties: Record<string, NotionProperty>;
};

type NotionQueryResponse = {
    results: NotionPage[];
    has_more: boolean;
    next_cursor: string | null;
};

type SongUpsertRow = {
    notion_id: string;
    title: string;
    genre: string;
    skill_level: string;
    key_difficulty: string;
    key_difficulty_star: boolean;
    speed_pressure: boolean;
    source: string;
    aliases: string;
    note: string;
};

function requireEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Missing environment variable: ${name}`);
    }

    return value;
}

function readText(prop: NotionProperty): string {
    if (!prop) return "";

    switch (prop.type) {
        case "title":
            return prop.title?.map((v: any) => v.plain_text).join("") ?? "";

        case "rich_text":
            return prop.rich_text?.map((v: any) => v.plain_text).join("") ?? "";

        case "select":
            return prop.select?.name ?? "";

        case "status":
            return prop.status?.name ?? "";

        case "multi_select":
            return prop.multi_select?.map((v: any) => v.name).join(", ") ?? "";

        case "number":
            return prop.number == null ? "" : String(prop.number);

        case "checkbox":
            return prop.checkbox ? "true" : "false";

        case "formula":
            if (prop.formula?.type === "string") return prop.formula.string ?? "";
            if (prop.formula?.type === "number") return String(prop.formula.number ?? "");
            if (prop.formula?.type === "boolean") return prop.formula.boolean ? "true" : "false";
            return "";

        default:
            return "";
    }
}

function readBoolean(prop: NotionProperty): boolean {
    if (!prop) return false;

    if (prop.type === "checkbox") {
        return Boolean(prop.checkbox);
    }

    const value = readText(prop).trim().toLowerCase();

    return ["o", "ㅇ", "yes", "y", "true", "1", "예"].includes(value);
}

function isSongUpsertRow(row: SongUpsertRow | null): row is SongUpsertRow {
    return row !== null;
}

async function queryAllNotionPages(): Promise<NotionPage[]> {
    const notionToken = requireEnv("NOTION_TOKEN");
    const dataSourceId = requireEnv("NOTION_DATA_SOURCE_ID");

    const pages: NotionPage[] = [];
    let startCursor: string | undefined = undefined;

    while (true) {
        const notionResponse: Awaited<ReturnType<typeof fetch>> = await fetch(
            `https://api.notion.com/v1/data_sources/${dataSourceId}/query`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${notionToken}`,
                    "Notion-Version": "2025-09-03",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    page_size: 100,
                    start_cursor: startCursor,
                }),
            }
        );

        if (!notionResponse.ok) {
            const body = await notionResponse.text();
            throw new Error(`Notion API error ${notionResponse.status}: ${body}`);
        }

        const data: NotionQueryResponse = await notionResponse.json();

        pages.push(...data.results);

        if (!data.has_more) {
            break;
        }

        startCursor = data.next_cursor ?? undefined;
    }

    return pages;
}

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const secret = url.searchParams.get("secret");

        if (secret !== requireEnv("SYNC_SECRET")) {
            return Response.json(
                { ok: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const supabaseUrl =
            process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

        if (!supabaseUrl) {
            throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL");
        }

        const supabase = createClient(
            supabaseUrl,
            requireEnv("SUPABASE_SERVICE_ROLE_KEY")
        );

        const pages = await queryAllNotionPages();

        const rows: SongUpsertRow[] = pages
            .map((page): SongUpsertRow | null => {
                const p = page.properties;

                const notionId = readText(p["id"]).trim();
                const title = readText(p["이름"]).trim();

                if (!notionId || !title) {
                    return null;
                }

                return {
                    notion_id: notionId,
                    title,
                    genre: readText(p["장르"]).trim(),
                    skill_level: readText(p["숙련도"]).trim(),
                    key_difficulty: readText(p["원키 난이도"]).trim(),
                    key_difficulty_star: readBoolean(p["난이도*"]),
                    speed_pressure: readBoolean(p["속도 압박"]),
                    source: readText(p["USB"]).trim(),
                    aliases: readText(p["동치"]).trim(),
                    note: readText(p["비고"]).trim(),
                };
            })
            .filter(isSongUpsertRow);

        if (rows.length === 0) {
            return Response.json({
                ok: false,
                error: "No valid rows found. Check Notion property names.",
            });
        }

        const { error } = await supabase.from("songs").upsert(rows, {
            onConflict: "notion_id",
        });

        if (error) {
            throw error;
        }

        return Response.json({
            ok: true,
            synced: rows.length,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);

        return Response.json(
            {
                ok: false,
                error: message,
            },
            { status: 500 }
        );
    }
}