import { useMemo, useState } from 'react';
import { useNotify } from '../../contexts/NotificationContext';
import { useDropzone } from 'react-dropzone';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../config/firebase';
import { format } from 'date-fns';

function DocumentUploader({ 
  flowId, 
  projectId, 
  userId, 
  documents = [], 
  onDocumentsChange,
  section = 'general',
  className = ""
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const notify = useNotify();

  const acceptedTypes = useMemo(() => ({
    'application/pdf': ['.pdf'],
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'text/plain': ['.txt'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
  }), []);

  function formatBytes(bytes) {
    if (!bytes && bytes !== 0) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
    const num = bytes / Math.pow(1024, i);
    return `${num.toFixed(num >= 100 ? 0 : num >= 10 ? 1 : 2)} ${sizes[i]}`;
  }

  const uploadFile = async (file) => {
    const timestamp = Date.now();
    const safeName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
    const storageRef = ref(storage, `companies/${userId}/flows/${flowId}/${section}/${safeName}`);

    return new Promise((resolve, reject) => {
      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        const task = uploadBytesResumable(storageRef, file, {
          contentType: file.type || 'application/octet-stream'
        });

        task.on('state_changed', (snapshot) => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(prev => ({ ...prev, [file.name]: pct }));
        }, (error) => {
          console.error('Upload failed:', error);
          setUploadProgress(prev => {
            const updated = { ...prev };
            delete updated[file.name];
            return updated;
          });
          reject(error);
        }, async () => {
          const downloadURL = await getDownloadURL(task.snapshot.ref);
          const newDoc = {
            id: timestamp.toString(),
            fileName: file.name,
            storagePath: task.snapshot.ref.fullPath,
            downloadURL,
            uploadDate: new Date().toISOString(),
            operator: userId,
            size: file.size,
            type: file.type
          };
          onDocumentsChange([...documents, newDoc]);
          setUploadProgress(prev => {
            const updated = { ...prev };
            delete updated[file.name];
            return updated;
          });
          resolve(newDoc);
        });
      } catch (err) {
        reject(err);
      }
    });
  };

  const deleteDocument = async (doc) => {
    try {
      // Delete from Storage
      const storageRef = ref(storage, doc.storagePath);
      await deleteObject(storageRef);
      
      // Remove from documents array
      onDocumentsChange(documents.filter(d => d.id !== doc.id));
    } catch (error) {
      console.error('Delete failed:', error);
      notify.error('Ștergerea documentului a eșuat.');
    }
  };

  const onDrop = async (acceptedFiles) => {
    setUploading(true);
    
    try {
      for (const file of acceptedFiles) {
        // extra guard; react-dropzone should filter by accept/maxSize already
        if (file.size > 10 * 1024 * 1024) {
          notify.info(`${file.name} depășește 10MB și a fost omis.`);
          continue;
        }
        await uploadFile(file);
      }
    } catch (error) {
      notify.error('Încărcarea fișierelor a eșuat.');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: 10485760, // 10MB
    accept: acceptedTypes,
    noClick: true,
    noKeyboard: true,
  });

  return (
    <div className={className}>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={open}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
          disabled={uploading}
        >
          Select. fisiere
        </button>

        <div
          {...getRootProps()}
          className={`flex-1 border-2 border-dashed rounded-md px-4 py-2 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <span className="text-sm text-gray-600">Uploading...</span>
          ) : isDragActive ? (
            <span className="text-sm text-indigo-600">Drop files here...</span>
          ) : (
            <span className="text-sm text-gray-600">Upload (drag & drop or click)
            </span>
          )}
        </div>
      </div>

      {/* Upload Progress */}
      {Object.entries(uploadProgress).map(([fileName, progress]) => (
        <div key={fileName} className="mb-2">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{fileName}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ))}

      {/* Documents List */}
      {documents.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Documente modalitati de informare</h4>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center gap-3 min-w-0">
                  {doc.type?.startsWith('image/') && (
                    <img src={doc.downloadURL} alt={doc.fileName} className="w-10 h-10 object-cover rounded-md border" />
                  )}
                  <a 
                    href={doc.downloadURL} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm truncate"
                  >
                    {doc.fileName}
                  </a>
                  <button
                    type="button"
                    onClick={() => deleteDocument(doc)}
                    className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                  >
                    Sterge fisier
                  </button>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="px-2 py-1 bg-gray-200 rounded">
                    Data incarcarii: {format(new Date(doc.uploadDate), 'dd.MM.yyyy HH:mm')}
                  </span>
                  <span className="px-2 py-1 bg-gray-200 rounded">
                    Operator: {doc.operator}
                  </span>
                  <span className="px-2 py-1 bg-gray-200 rounded whitespace-nowrap">
                    {formatBytes(doc.size)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentUploader;
