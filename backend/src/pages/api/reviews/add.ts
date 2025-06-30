import { NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs/promises';

interface FileCleanupError {
  filepath: string;
  error: string;
}

interface ErrorResponse {
  success: boolean;
  error: string;
  details?: {
    cleanupErrors?: FileCleanupError[];
    stack?: string;
    rawError?: unknown;
  };
}

async function handleFileCleanup(files: formidable.Files): Promise<FileCleanupError[]> {
  const errors: FileCleanupError[] = [];
  const maybeFiles = files.images 
    ? Array.isArray(files.images) 
      ? files.images 
      : [files.images]
    : [];

  await Promise.all(
    maybeFiles.map(async (file) => {
      if (!file?.filepath) return;
      
      try {
        await fs.unlink(file.filepath);
      } catch (error) {
        errors.push({
          filepath: file.filepath,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    })
  );

  return errors;
}

export async function handleApiError(
  res: NextApiResponse,
  error: unknown,
  files?: formidable.Files
): Promise<void> {
  try {
    const normalizedError = normalizeError(error);
    let cleanupErrors: FileCleanupError[] = [];

    if (files) {
      try {
        cleanupErrors = await handleFileCleanup(files);
      } catch (cleanupError) {
        console.error('File cleanup failed:', cleanupError);
        cleanupErrors = [{
          filepath: 'unknown',
          error: 'Failed to cleanup files'
        }];
      }
    }

    const response: ErrorResponse = {
      success: false,
      error: normalizedError.message,
      ...(process.env.NODE_ENV === 'development' && {
        details: {
          ...(normalizedError.stack && { stack: normalizedError.stack }),
          ...(cleanupErrors.length > 0 && { cleanupErrors }),
          rawError: normalizedError.rawError
        }
      })
    };

    res.status(normalizedError.statusCode).json(response);
  } catch (errorHandlingError) {
    console.error('Error handling failed:', errorHandlingError);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

function normalizeError(error: unknown): {
  message: string;
  statusCode: number;
  stack?: string;
  rawError?: unknown;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      statusCode: 500,
      stack: error.stack,
      rawError: error
    };
  }
  return {
    message: 'Internal server error',
    statusCode: 500,
    rawError: error
  };
}

export { handleFileCleanup };