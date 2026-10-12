const DB_NAME =
  "vlearning-studio-db";

const DB_VERSION =
  1;

const VIDEO_STORE =
  "videos";

/* =========================================================
   MỞ DATABASE
========================================================= */

function openDatabase(): Promise<IDBDatabase> {
  return new Promise(
    (resolve, reject) => {
      const request =
        indexedDB.open(
          DB_NAME,
          DB_VERSION
        );

      request.onerror =
        () => {
          reject(
            request.error
          );
        };

      request.onsuccess =
        () => {
          resolve(
            request.result
          );
        };

      request.onupgradeneeded =
        () => {
          const db =
            request.result;

          if (
            !db.objectStoreNames.contains(
              VIDEO_STORE
            )
          ) {
            db.createObjectStore(
              VIDEO_STORE
            );
          }
        };
    }
  );
}

/* =========================================================
   LƯU VIDEO
========================================================= */

export async function saveVideo(
  pageId: string,
  file: File
) {
  const db =
    await openDatabase();

  return new Promise<void>(
    (resolve, reject) => {
      const transaction =
        db.transaction(
          VIDEO_STORE,
          "readwrite"
        );

      const store =
        transaction.objectStore(
          VIDEO_STORE
        );

      const request =
        store.put(
          file,
          pageId
        );

      request.onsuccess =
        () => {
          resolve();
        };

      request.onerror =
        () => {
          reject(
            request.error
          );
        };
    }
  );
}

/* =========================================================
   ĐỌC VIDEO
========================================================= */

export async function getVideo(
  pageId: string
): Promise<File | null> {
  const db =
    await openDatabase();

  return new Promise(
    (resolve, reject) => {
      const transaction =
        db.transaction(
          VIDEO_STORE,
          "readonly"
        );

      const store =
        transaction.objectStore(
          VIDEO_STORE
        );

      const request =
        store.get(
          pageId
        );

      request.onsuccess =
        () => {
          resolve(
            request.result ??
              null
          );
        };

      request.onerror =
        () => {
          reject(
            request.error
          );
        };
    }
  );
}

/* =========================================================
   XÓA VIDEO
========================================================= */

export async function deleteVideo(
  pageId: string
) {
  const db =
    await openDatabase();

  return new Promise<void>(
    (resolve, reject) => {
      const transaction =
        db.transaction(
          VIDEO_STORE,
          "readwrite"
        );

      const store =
        transaction.objectStore(
          VIDEO_STORE
        );

      const request =
        store.delete(
          pageId
        );

      request.onsuccess =
        () => {
          resolve();
        };

      request.onerror =
        () => {
          reject(
            request.error
          );
        };
    }
  );
}