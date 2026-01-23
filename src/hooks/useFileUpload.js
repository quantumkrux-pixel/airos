const handleOpenFile = (name, path) => {
  console.log('Opening file:', name, path);

  const file = fileSystem[path];
  if (!file) {
    console.warn('File not found:', path);
    return;
  }

  const lowerPath = path.toLowerCase();

  // Build a valid media src
  const buildMediaSrc = () => {
    // If already a Data URL, use it directly
    if (typeof file.content === 'string' && file.content.startsWith('data:')) {
      return file.content;
    }

    // Otherwise wrap base64 in a Data URL
    const ext = lowerPath.split('.').pop();
    const mimeMap = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      ogg: 'video/ogg',
      mov: 'video/quicktime',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      flac: 'audio/flac',
      m4a: 'audio/mp4',
      aac: 'audio/aac'
    };
    const mime = mimeMap[ext] || 'application/octet-stream';

    return `data:${mime};base64,${file.content || ''}`;
  };

  // Images
  if (lowerPath.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
    const src = buildMediaSrc();
    createWindow('image', {
      title: name,
      src,
      filePath: path
    });
    return;
  }

  // Audio + Video
  if (lowerPath.match(/\.(mp4|webm|ogg|mov|mp3|wav|flac|m4a|aac)$/i)) {
    const src = buildMediaSrc();
    createWindow('video', {
      title: name,
      src,
      width: 900,
      height: 650
    });
    return;
  }

  // Text files
  createWindow('text', {
    title: name,
    filePath: path,
    width: 900,
    height: 650
  });
};