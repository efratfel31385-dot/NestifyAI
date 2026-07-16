// src/services/apiService.js
export const generateDesignAdvice = async (style, furnitureList) => {
    try {
        const response = await fetch("http://localhost:8000/generate_text", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                style: style,
                furniture_list: furnitureList
            })
        });
        const data = await response.json();
        
        if (data.status === "error") {
            console.error( data.message); 
            return "Failed to generate design advice.";
        }
        
        return data.generated_text;
        
    } catch (error) {
        console.error("Error generating text:", error);
        return "Failed to generate design advice.";
    }
};