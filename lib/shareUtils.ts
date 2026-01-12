import { AnalysisReport } from "./types";

/**
 * Encode AnalysisReport to Base64 URL parameter
 */
export function encodeResultToURL(data: AnalysisReport): string {
    try {
        const jsonString = JSON.stringify(data);
        const base64 = btoa(encodeURIComponent(jsonString));
        return base64;
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
        const jsonString = decodeURIComponent(atob(urlParam));
        const data = JSON.parse(jsonString);
        return data as AnalysisReport;
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
