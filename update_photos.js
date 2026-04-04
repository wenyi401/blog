const fs = require('fs');
const path = require('path');

const postsDir = 'source/_posts';
const files = fs.readdirSync(postsDir);

// 二次元风格的图片（随机选择）
const photos = [
    'https://cdn.jsdelivr.net/gh/honjun/cdn@1.4/img/banner/about.jpg',
    'https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png',
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800', // 二次元风格
    'https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800', // 动漫风格
];

files.forEach(file => {
    if (!file.endsWith('.md')) return;
    
    const filePath = path.join(postsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 检查是否已经有 photos 字段
    if (content.includes('photos:')) {
        console.log(`[SKIP] ${file} - already has photos`);
        return;
    }
    
    // 在 front-matter 的 description 后面添加 photos
    const photo = photos[Math.floor(Math.random() * photos.length)];
    
    if (content.startsWith('---')) {
        const parts = content.split('---');
        if (parts.length >= 3) {
            const frontMatter = parts[1];
            const body = parts.slice(2).join('---');
            
            // 在 description 行后添加 photos
            if (frontMatter.includes('description:')) {
                const newFrontMatter = frontMatter.replace(
                    /(description:.*\n)/,
                    `$1photos: ${photo}\n`
                );
                content = `---\n${newFrontMatter}---\n${body}`;
            } else {
                // 没有 description，就在 keywords 后添加
                const newFrontMatter = frontMatter.replace(
                    /(keywords:.*\n)/,
                    `$1photos: ${photo}\n`
                );
                content = `---\n${newFrontMatter}---\n${body}`;
            }
            
            fs.writeFileSync(filePath, content);
            console.log(`[OK] ${file} - added photo`);
        }
    }
});
