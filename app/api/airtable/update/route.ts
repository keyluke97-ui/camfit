import { NextResponse } from 'next/server';
import { getBase } from '@/lib/airtable';

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { recordId, fields } = body;

        if (!recordId || !fields) {
            return NextResponse.json({ error: "Missing recordId or fields" }, { status: 400 });
        }

        const result = getBase();
        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        const base = result.base;
        const tableName = (process.env.AIRTABLE_TABLE_NAME || '사진 진단 캠핑장 DB').trim();
        const table = base(tableName);

        // Perform the update
        await table.update(recordId, fields);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Airtable Update Error:", error);
        return NextResponse.json({ error: error.message || "Update failed" }, { status: 500 });
    }
}
