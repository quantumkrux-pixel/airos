import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { webcontainer } from '../webcontainerInstance';

// Directories that belong to WebContainer runtime mirror (for code/projects)
const WEBCONTAINER_ROOTS = ['/Projects', '/Dev', '/App'];

export const useFileSystem = (userId) => {
  const [fileSystem, setFileSystem] = useState({});

  useEffect(() => {
    if (userId) {
      initialize();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // -------------------------------
  // INIT: Supabase is source of truth
  // -------------------------------
  const initialize = async () => {
    // 1) Load Supabase FS into React state
    await reloadFileSystem();
    // 2) Mirror Supabase FS into WebContainer (runtime view)
    await syncSupabaseIntoWebContainer();
  };

  // -------------------------------
  // LOAD SUPABASE FS (single source of truth)
  // -------------------------------
  const loadSupabaseFS = async () => {
    const fs = {};
    fs['/'] = { type: 'directory', children: [] };

    const { data: files, error } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Supabase FS load error:', error);
      return fs;
    }

    if (!files || files.length === 0) {
      await initializeDefaultDirectories(userId);
      return loadSupabaseFS();
    }

    // Build nodes
    files.forEach((file) => {
      fs[file.path] = {
        type: file.type,
        content: file.content,
        children: file.type === 'directory' ? [] : undefined
      };
    });

    // Build directory children
    files.forEach((file) => {
      if (file.parent_path && fs[file.parent_path]) {
        if (!fs[file.parent_path].children.includes(file.name)) {
          fs[file.parent_path].children.push(file.name);
        }
      }
    });

    return fs;
  };

  // -------------------------------
  // RELOAD FS (from Supabase only)
  // -------------------------------
  const reloadFileSystem = async () => {
    if (!userId) return;
    const supabaseFS = await loadSupabaseFS();

    // Ensure root exists
    if (!supabaseFS['/']) {
      supabaseFS['/'] = { type: 'directory', children: [] };
    }

    setFileSystem(supabaseFS);
  };

  // -------------------------------
  // SYNC: Supabase → WebContainer (mirror)
  // -------------------------------
  const syncSupabaseIntoWebContainer = async () => {
    if (!userId) return;

    const supabaseFS = await loadSupabaseFS();

    for (const path in supabaseFS) {
      const node = supabaseFS[path];

      if (path === '/') continue;

      // Only mirror specific roots into WebContainer (code/project areas)
      if (!WEBCONTAINER_ROOTS.some((root) => path.startsWith(root))) {
        continue;
      }

      if (node.type === 'directory') {
        try {
          await webcontainer.fs.mkdir(path, { recursive: true });
        } catch {
          // ignore mkdir errors (already exists, etc.)
        }
      } else {
        try {
          // Content is stored as text or Data URL in Supabase; write as UTF-8
          await webcontainer.fs.writeFile(path, node.content || '', 'utf-8');
        } catch {
          // ignore write errors for now
        }
      }
    }
  };

  // -------------------------------
  // DEFAULT DIRECTORIES
  // -------------------------------
  const initializeDefaultDirectories = async (userId) => {
    const defaultDirs = [
      { path: '/', name: 'root', type: 'directory', parent_path: null },
      { path: '/Documents', name: 'Documents', type: 'directory', parent_path: '/' },
      { path: '/Pictures', name: 'Pictures', type: 'directory', parent_path: '/' },
      { path: '/Videos', name: 'Videos', type: 'directory', parent_path: '/' },
      { path: '/Desktop', name: 'Desktop', type: 'directory', parent_path: '/' },
      { path: '/Projects', name: 'Projects', type: 'directory', parent_path: '/' },
      { path: '/Dev', name: 'Dev', type: 'directory', parent_path: '/' }
    ];

    const dirsWithUserId = defaultDirs.map((dir) => ({
      ...dir,
      user_id: userId
    }));

    await supabase.from('files').insert(dirsWithUserId);
  };

  // -------------------------------
  // SAVE FILE (Supabase canonical + optional WebContainer mirror)
  // -------------------------------
  const saveFile = async (path, content, type = 'file') => {
    if (!userId) return;

    const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
    const fileName = path.substring(path.lastIndexOf('/') + 1);

    try {
      const { data: existing } = await supabase
        .from('files')
        .select('id')
        .eq('user_id', userId)
        .eq('path', path)
        .single();

      if (existing) {
        await supabase
          .from('files')
          .update({
            content,
            type,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('files').insert({
          user_id: userId,
          path,
          name: fileName,
          type,
          content,
          parent_path: parentPath
        });
      }

      // Update React FS state
      await reloadFileSystem();

      // Mirror into WebContainer for code-related paths
      if (WEBCONTAINER_ROOTS.some((root) => path.startsWith(root))) {
        try {
          await webcontainer.fs.writeFile(path, content ?? '', 'utf-8');
        } catch (err) {
          console.warn('WebContainer mirror write failed:', err);
        }
      }
    } catch (error) {
      console.error('Error saving file:', error);
    }
  };

  // -------------------------------
  // CREATE DIRECTORY (Supabase canonical + WebContainer mirror)
  // -------------------------------
  const createDirectory = async (path, name) => {
    if (!userId) return;

    const fullPath = path === '/' ? `/${name}` : `${path}/${name}`;

    try {
      await supabase.from('files').insert({
        user_id: userId,
        path: fullPath,
        name,
        type: 'directory',
        parent_path: path
      });

      await reloadFileSystem();

      if (WEBCONTAINER_ROOTS.some((root) => fullPath.startsWith(root))) {
        try {
          await webcontainer.fs.mkdir(fullPath, { recursive: true });
        } catch (err) {
          console.warn('WebContainer mirror mkdir failed:', err);
        }
      }
    } catch (error) {
      console.error('Error creating directory:', error);
    }
  };

  // -------------------------------
  // DELETE FILE/DIRECTORY (Supabase canonical + WebContainer mirror)
  // -------------------------------
  const deleteFile = async (path) => {
    if (!userId) return;

    try {
      await supabase
        .from('files')
        .delete()
        .eq('user_id', userId)
        .eq('path', path);

      await reloadFileSystem();

      if (WEBCONTAINER_ROOTS.some((root) => path.startsWith(root))) {
        try {
          await webcontainer.fs.rm(path, { recursive: true });
        } catch (err) {
          console.warn('WebContainer mirror rm failed:', err);
        }
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  return {
    fileSystem,
    saveFile,
    createDirectory,
    deleteFile,
    reloadFileSystem,
    syncSupabaseIntoWebContainer
  };
};