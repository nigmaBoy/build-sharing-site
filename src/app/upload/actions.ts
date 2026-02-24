"use server"

export async function checkImageNSFW(formData: FormData) {
    const apiKey = process.env.JIGSAWSTACK_API_KEY;
    const file = formData.get("file") as File;

    if (!apiKey) {
        console.error("❌ JIGSAWSTACK_API_KEY is missing in .env.local");
        return { safe: true }; 
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // We use the endpoint you found: /v1/validate/nsfw
        // We send it as 'multipart/form-data' because it's a local file, not a URL
        const apiFormData = new FormData();
        apiFormData.append("file", new Blob([buffer]), file.name);

        console.log(`🛡️  Scanning: ${file.name}...`);

        const response = await fetch("https://api.jigsawstack.com/v1/validate/nsfw", {
            method: "POST",
            headers: {
                "x-api-key": apiKey,
            },
            body: apiFormData
        });

        const result = await response.json();
        console.log("🛡️  AI Response:", result);

        // If the AI says nsfw is true, or if nudity/gore is detected
        if (result.success && (result.nsfw === true || result.nudity === true || result.gore === true)) {
            return { safe: false, reason: "Inappropriate content detected (NSFW/Gore)." };
        }

        return { safe: true };
    } catch (error: any) {
        console.error("❌ AI Shield Crash:", error.message);
        return { safe: true }; // Let it through if the AI service is down
    }
}