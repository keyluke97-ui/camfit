import { NextResponse } from "next/server";
import Airtable from "airtable";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { recordId, fieldName } = await req.json();

        if (!recordId || !fieldName) {
            return NextResponse.json(
                { error: "recordId와 fieldName이 필요합니다." },
                { status: 400 }
            );
        }

        const apiKey = process.env.AIRTABLE_API_KEY;
        const baseId = process.env.AIRTABLE_BASE_ID;
        const tableName = (process.env.AIRTABLE_TABLE_NAME || "").trim();

        if (!apiKey || !baseId || !tableName) {
            return NextResponse.json(
                { error: "Airtable 환경 변수가 설정되지 않았습니다." },
                { status: 500 }
            );
        }

        const base = new Airtable({ apiKey }).base(baseId);
        const table = base(tableName);

        // PATCH: 해당 필드만 true로 업데이트
        await table.update(recordId, {
            [fieldName]: true
        });

        console.log(`✅ Airtable 업데이트 성공: ${recordId} - ${fieldName}`);

        return NextResponse.json({
            success: true,
            message: `${fieldName} 필드가 성공적으로 업데이트되었습니다.`
        });

    } catch (error: any) {
        console.error("❌ Airtable 업데이트 실패:", error);
        return NextResponse.json(
            { error: error.message || "업데이트 실패" },
            { status: 500 }
        );
    }
}
