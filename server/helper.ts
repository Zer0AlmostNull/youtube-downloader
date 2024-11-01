export function escapeFileName(name: string): string {
    // Define a regular expression for characters that are not allowed in filenames
    const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g;
    
    // Replace invalid characters with underscores
    const escapedName = name.replace(invalidChars, '_');
    
    // Trim trailing whitespace and replace multiple underscores with a single underscore
    return escapedName.replace(/\s+/g, '_').replace(/_+/g, '_');
}
