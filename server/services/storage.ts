import { constants } from 'node:fs'
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'

const DEFAULT_STORAGE_DIR = './data/storage'
const STORAGE_DIRECTORIES = ['uploads', 'jobs'] as const

function getConfiguredStorageDir() {
  try {
    return useRuntimeConfig().storageDir
  }
  catch {
    return process.env.STORAGE_DIR || DEFAULT_STORAGE_DIR
  }
}

function getStorageRoot() {
  return resolve(process.cwd(), getConfiguredStorageDir())
}

function toStoragePath(path: string) {
  return path.replaceAll('\\', '/')
}

function hasUnsafeSegment(path: string) {
  return path.split('/').some(segment => !segment || segment === '.' || segment === '..')
}

function isAbsoluteStoragePath(path: string) {
  return isAbsolute(path) || /^[a-zA-Z]:[\\/]/.test(path)
}

function getStoragePathError(path: string, normalizedPath: string) {
  const checks: Array<[boolean, string]> = [
    [!path || path.includes('\0'), 'Storage path must be a non-empty relative path.'],
    [isAbsoluteStoragePath(path), 'Storage path must not be absolute.'],
    [hasUnsafeSegment(normalizedPath), 'Storage path contains an unsafe segment.'],
  ]

  return checks.find(([failed]) => failed)?.[1]
}

function assertSafeRelativePath(path: string) {
  const normalized = toStoragePath(path)
  const error = getStoragePathError(path, normalized)

  if (error) {
    throw new Error(error)
  }

  return normalized
}

function resolveStoragePath(path: string) {
  const root = getStorageRoot()
  const relativePath = assertSafeRelativePath(path)
  const absolutePath = resolve(root, relativePath)
  const rootRelativePath = relative(root, absolutePath)

  if (rootRelativePath.startsWith(`..${sep}`) || rootRelativePath === '..' || isAbsolute(rootRelativePath)) {
    throw new Error('Storage path escapes the storage directory.')
  }

  return absolutePath
}

async function ensureStorageDirectories() {
  const root = getStorageRoot()

  await mkdir(root, { recursive: true })
  await Promise.all(STORAGE_DIRECTORIES.map(directory => mkdir(resolve(root, directory), { recursive: true })))

  return {
    root,
    directories: [...STORAGE_DIRECTORIES],
  }
}

async function writeStorageFile(path: string, data: Buffer | Uint8Array | string) {
  await ensureStorageDirectories()

  const absolutePath = resolveStoragePath(path)
  await mkdir(dirname(absolutePath), { recursive: true })
  await writeFile(absolutePath, data)

  return {
    path: assertSafeRelativePath(path),
    absolutePath,
  }
}

async function readStorageFile(path: string) {
  await ensureStorageDirectories()

  return readFile(resolveStoragePath(path))
}

async function storageFileExists(path: string) {
  await ensureStorageDirectories()

  try {
    await access(resolveStoragePath(path), constants.F_OK)
    return true
  }
  catch {
    return false
  }
}

function uploadStoragePath(uploadId: string) {
  return assertSafeRelativePath(`uploads/${uploadId}.png`)
}

function jobStoragePath(jobId: string, ...segments: string[]) {
  return assertSafeRelativePath(['jobs', jobId, ...segments].join('/'))
}

async function checkStorageHealth() {
  const { root, directories } = await ensureStorageDirectories()
  const probePath = `uploads/.health-${crypto.randomUUID()}.tmp`
  const probeData = Buffer.from('sprite-forge-storage-health')

  try {
    await writeStorageFile(probePath, probeData)
    const readData = await readStorageFile(probePath)

    return {
      ok: readData.equals(probeData),
      path: root,
      directories,
    }
  }
  finally {
    await rm(resolveStoragePath(probePath), { force: true })
  }
}

export const storage = {
  getRoot: getStorageRoot,
  resolvePath: resolveStoragePath,
  ensureDirectories: ensureStorageDirectories,
  writeFile: writeStorageFile,
  readFile: readStorageFile,
  exists: storageFileExists,
  uploadPath: uploadStoragePath,
  jobPath: jobStoragePath,
  checkHealth: checkStorageHealth,
}
