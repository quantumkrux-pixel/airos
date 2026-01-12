import { supabase } from '../utils/supabase';

export const useFileOperations = (userId, reloadFileSystem) => {
  
  const moveFile = async (sourcePath, destinationPath, fileName) => {
    if (!userId) return { success: false, error: 'No user ID' };

    try {
      console.log('Moving file:', { sourcePath, destinationPath, fileName });

      // Get the file being moved
      const { data: fileData, error: fetchError } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', userId)
        .eq('path', sourcePath)
        .single();

      if (fetchError) throw fetchError;
      if (!fileData) throw new Error('File not found');

      // Calculate new path
      const newPath = destinationPath === '/' 
        ? `/${fileName}` 
        : `${destinationPath}/${fileName}`;

      // Check if destination already has a file with same name
      const { data: existingFile } = await supabase
        .from('files')
        .select('id')
        .eq('user_id', userId)
        .eq('path', newPath)
        .single();

      if (existingFile) {
        return { success: false, error: 'A file with this name already exists in the destination' };
      }

      // Update the file's path and parent_path
      const { error: updateError } = await supabase
        .from('files')
        .update({
          path: newPath,
          parent_path: destinationPath,
          updated_at: new Date().toISOString()
        })
        .eq('id', fileData.id);

      if (updateError) throw updateError;

      // If it's a directory, we need to update all children paths recursively
      if (fileData.type === 'directory') {
        await updateChildrenPaths(userId, sourcePath, newPath);
      }

      // Reload filesystem to reflect changes
      await reloadFileSystem();

      console.log('File moved successfully');
      return { success: true };
    } catch (error) {
      console.error('Error moving file:', error);
      return { success: false, error: error.message };
    }
  };

  const updateChildrenPaths = async (userId, oldParentPath, newParentPath) => {
    try {
      // Get all children of the directory
      const { data: children, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', userId)
        .eq('parent_path', oldParentPath);

      if (error) throw error;
      if (!children || children.length === 0) return;

      // Update each child
      for (const child of children) {
        const oldChildPath = child.path;
        const newChildPath = oldChildPath.replace(oldParentPath, newParentPath);

        await supabase
          .from('files')
          .update({
            path: newChildPath,
            parent_path: newParentPath,
            updated_at: new Date().toISOString()
          })
          .eq('id', child.id);

        // Recursively update if this child is also a directory
        if (child.type === 'directory') {
          await updateChildrenPaths(userId, oldChildPath, newChildPath);
        }
      }
    } catch (error) {
      console.error('Error updating children paths:', error);
      throw error;
    }
  };

  const copyFile = async (sourcePath, destinationPath, fileName) => {
    if (!userId) return { success: false, error: 'No user ID' };

    try {
      // Get the file being copied
      const { data: fileData, error: fetchError } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', userId)
        .eq('path', sourcePath)
        .single();

      if (fetchError) throw fetchError;
      if (!fileData) throw new Error('File not found');

      // Calculate new path
      const newPath = destinationPath === '/' 
        ? `/${fileName}` 
        : `${destinationPath}/${fileName}`;

      // Check if destination already has a file with same name
      const { data: existingFile } = await supabase
        .from('files')
        .select('id')
        .eq('user_id', userId)
        .eq('path', newPath)
        .single();

      if (existingFile) {
        return { success: false, error: 'A file with this name already exists in the destination' };
      }

      // Create new file
      const { error: insertError } = await supabase
        .from('files')
        .insert({
          user_id: userId,
          path: newPath,
          name: fileName,
          type: fileData.type,
          content: fileData.content,
          parent_path: destinationPath
        });

      if (insertError) throw insertError;

      await reloadFileSystem();

      return { success: true };
    } catch (error) {
      console.error('Error copying file:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    moveFile,
    copyFile
  };
};