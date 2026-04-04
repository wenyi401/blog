const fs = require('fs');
const path = require('path');

const postsDir = 'source/_posts';
const files = fs.readdirSync(postsDir);

// 二次元风格的图片
const photos = [
    'https://cdn.jsdelivr.net/gh/honjun/cdn@1.4/img/banner/about.jpg',
    'https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png',
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800',
    'https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800',
];

files.forEach((file, index) => {
    if (!file.endsWith('.md')) return;
    
    const filePath = path.join(postsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 已经有 photos 就跳过
    if (content.includes('photos:')) {
        console.log(`[SKIP] ${file}`);
        return;
    }
    
    const photo = photos[index % photos.length];
    
    // 在 front-matter 中添加 photos
    // 匹配 --- 之间的 front-matter
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (match) {
        const frontMatter = match[1];
        const body = content.slice(match[0].length);
        
        // 在 categories 后面添加 photos，如果没有 categories 就在 tags 后面
        let newFrontMatter;
        if (frontMatter.includes('categories:')) {
            newFrontMatter = frontMatter.replace(
                /(categories:.*\n)/,
                `$1photos: ${photo}\n`
            );
        } else if (frontMatter.includes('tags:')) {
            newFrontMatter = frontMatter.replace(
                /(tags:.*\n)/,
                `$1photos: ${photo}\n`
            );
        } else {
            // 都没有就在 title 后添加
            newFrontMatter = frontMatter.replace(
                /(title:.*\n)/,
                `$1photos: ${photo}\n`
            );
        }
        
        content = `---\n${newFrontMatter}---\n${body}`;
        fs.writeFileSync(filePath, content);
        console.log(`[OK] ${file} - added photo`);
    }
});
