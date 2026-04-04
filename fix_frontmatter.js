const fs = require('fs');
const path = require('path');

const postsDir = 'source/_posts';
const files = fs.readdirSync(postsDir);

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
    
    // 检查 front-matter 是否正确
    if (!content.startsWith('---\n')) {
        console.log(`[SKIP] ${file} - bad format`);
        return;
    }
    
    // 找到 front-matter 结束位置
    const endMatch = content.match(/^---\n[\s\S]*?\n---\n/);
    if (!endMatch) {
        console.log(`[SKIP] ${file} - no front-matter end`);
        return;
    }
    
    const frontMatterEnd = endMatch[0].length;
    const body = content.slice(frontMatterEnd);
    
    // 重新解析 front-matter
    const lines = content.slice(4, frontMatterEnd - 4).split('\n');
    const frontMatter = {};
    lines.forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const key = line.slice(0, colonIndex).trim();
            const value = line.slice(colonIndex + 1).trim();
            frontMatter[key] = value;
        }
    });
    
    // 添加 photos
    if (!frontMatter.photos) {
        frontMatter.photos = photos[index % photos.length];
    }
    
    // 重新生成 front-matter
    let newFrontMatter = '---\n';
    for (const [key, value] of Object.entries(frontMatter)) {
        newFrontMatter += `${key}: ${value}\n`;
    }
    newFrontMatter += '---\n';
    
    content = newFrontMatter + body;
    fs.writeFileSync(filePath, content);
    console.log(`[OK] ${file}`);
});

console.log('\nDone!');
