
export const cleanData = (obj: any): any => {
    const clean: any = {};
    if (!obj || typeof obj !== 'object') return obj;
    Object.keys(obj).forEach(key => {
        if (obj[key] === undefined) return;
        if (Array.isArray(obj[key])) {
            clean[key] = obj[key].map((item: any) => typeof item === 'object' ? cleanData(item) : item);
        } else if (obj[key] !== null && typeof obj[key] === 'object' && !(obj[key] instanceof Date)) {
            clean[key] = cleanData(obj[key]);
        } else {
            clean[key] = obj[key];
        }
    });
    return clean;
};

export const compressToSmallBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 400;
                const MAX_HEIGHT = 400;
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                } else {
                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
        };
        reader.onerror = error => reject(error);
    });
};

export const uploadImageToStorage = async (file: File, _path: string): Promise<string> => {
    try {
        return await compressToSmallBase64(file);
    } catch (error) {
        console.error("Error al procesar imagen:", error);
        throw error;
    }
};
