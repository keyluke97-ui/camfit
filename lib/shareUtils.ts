import { AnalysisReport } from "./types";

/**
 * Encode AnalysisReport to Base64 URL parameter
 */
export function encodeResultToURL(data: AnalysisReport): string {
    try {
        const jsonString = JSON.stringify(data);
        const encoded = typeof window !== 'undefined'
            ? btoa(encodeURIComponent(jsonString))
            : Buffer.from(encodeURIComponent(jsonString)).toString('base64');
        return encoded;
    } catch (error) {
        console.error("Failed to encode result:", error);
        return "";
    }
}

/**
 * Decode Base64 URL parameter to AnalysisReport
 */
export function decodeURLToResult(urlParam: string): AnalysisReport | null {
    try {
        const jsonString = typeof window !== 'undefined'
            ? decodeURIComponent(atob(urlParam))
            : decodeURIComponent(Buffer.from(urlParam, 'base64').toString());
        return JSON.parse(jsonString) as AnalysisReport;
    } catch (error) {
        console.error("Failed to decode result:", error);
        return null;
    }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error("Failed to copy:", error);
        return false;
    }
}
