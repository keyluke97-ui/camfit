import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendErrorEmail(context: string, error: any, data?: any) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY is missing. Skipping email notification.");
        return;
    }

    const errorMessage = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
    const timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

    try {
        await resend.emails.send({
            from: 'Camfit AI Debugger <onboarding@resend.dev>',
            to: 'keyluke97@nextedition.co.kr',
            subject: `[Camfit AI Error] ${context}`,
            html: `
                <h2>🚨 시스템 에러 알림</h2>
                <p><strong>발생 시각:</strong> ${timestamp}</p>
                <p><strong>발생 위치:</strong> ${context}</p>
                <p><strong>에러 내용:</strong> <span style="color: red;">${errorMessage}</span></p>
                
                <hr />
                <h3>📊 입력 데이터 (참고용)</h3>
                <pre style="background: #f4f4f4; pading: 10px; border-radius: 5px; overflow-x: auto;">
${JSON.stringify(data || {}, null, 2)}
                </pre>
            `
        });
        console.log("✅ Error notification email sent.");
    } catch (err) {
        console.error("❌ Failed to send error email:", err);
    }
}
