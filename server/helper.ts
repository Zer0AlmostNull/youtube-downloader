export function escapeFileName(filename: string): string {
    // Escape double quotes and other unsafe characters for RFC compatibility
    const safeFilename = filename.replace(/["\\]/g, '_');  // Replace quotes and backslashes
    const encodedFilename = encodeURIComponent(safeFilename);

    // Create the Content-Disposition header value
    return encodedFilename;
}
