const DB_NAME =
  "vlearning-studio-thumbnail-db";

const DB_VERSION =
  1;

const STORE_NAME =
  "thumbnails";

/* =========================================================
   OPEN DATABASE
========================================================= */

function openDb(): Promise<IDBDatabase> {
  return new Promise(
    (resolve, reject) => {
      const request =
        indexedDB.open(
          DB_NAME,
          DB_VERSION
        );

      request.onupgradeneeded =
        () => {
          const db =
            request.result;

          if (
            !db.objectStoreNames.contains(
              STORE_NAME
            )
          ) {
            db.createObjectStore(
              STORE_NAME
            );
          }
        };

      request.onsuccess =
        () => {
          resolve(
            request.result
          );
        };

      request.onerror =
        () => {
          reject(
            request.error ??
              new Error(
                "Không mở được cơ sở dữ liệu thumbnail."
              )
          );
        };
    }
  );
}

/* =========================================================
   SAVE
========================================================= */

export async function saveProjectThumbnail(
  projectId: string,
  image: Blob
) {
  const db =
    await openDb();

  try {
    await new Promise<void>(
      (
        resolve,
        reject
      ) => {
        const transaction =
          db.transaction(
            STORE_NAME,
            "readwrite"
          );

        const store =
          transaction.objectStore(
            STORE_NAME
          );

        store.put(
          image,
          projectId
        );

        transaction.oncomplete =
          () => {
            resolve();
          };

        transaction.onerror =
          () => {
            reject(
              transaction.error ??
                new Error(
                  "Không lưu được thumbnail."
                )
            );
          };

        transaction.onabort =
          () => {
            reject(
              transaction.error ??
                new Error(
                  "Lưu thumbnail bị hủy."
                )
            );
          };
      }
    );
  } finally {
    db.close();
  }
}

/* =========================================================
   GET
========================================================= */

export async function getProjectThumbnail(
  projectId: string
): Promise<Blob | null> {
  const db =
    await openDb();

  try {
    return await new Promise<
      Blob | null
    >(
      (
        resolve,
        reject
      ) => {
        const transaction =
          db.transaction(
            STORE_NAME,
            "readonly"
          );

        const store =
          transaction.objectStore(
            STORE_NAME
          );

        const request =
          store.get(
            projectId
          );

        request.onsuccess =
          () => {
            const result =
              request.result;

            resolve(
              result instanceof Blob
                ? result
                : null
            );
          };

        request.onerror =
          () => {
            reject(
              request.error ??
                new Error(
                  "Không đọc được thumbnail."
                )
            );
          };
      }
    );
  } finally {
    db.close();
  }
}

/* =========================================================
   DELETE
========================================================= */

export async function deleteProjectThumbnail(
  projectId: string
) {
  const db =
    await openDb();

  try {
    await new Promise<void>(
      (
        resolve,
        reject
      ) => {
        const transaction =
          db.transaction(
            STORE_NAME,
            "readwrite"
          );

        const store =
          transaction.objectStore(
            STORE_NAME
          );

        store.delete(
          projectId
        );

        transaction.oncomplete =
          () => {
            resolve();
          };

        transaction.onerror =
          () => {
            reject(
              transaction.error ??
                new Error(
                  "Không xóa được thumbnail."
                )
            );
          };

        transaction.onabort =
          () => {
            reject(
              transaction.error ??
                new Error(
                  "Xóa thumbnail bị hủy."
                )
            );
          };
      }
    );
  } finally {
    db.close();
  }
}

/* =========================================================
   COPY
========================================================= */

export async function copyProjectThumbnail(
  sourceProjectId: string,
  targetProjectId: string
) {
  const thumbnail =
    await getProjectThumbnail(
      sourceProjectId
    );

  if (!thumbnail) {
    return false;
  }

  await saveProjectThumbnail(
    targetProjectId,
    thumbnail
  );

  return true;
}