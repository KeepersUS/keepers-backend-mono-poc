import { firestore } from 'firebase-admin';

import { NestedKeyOf } from './dbbuilder';

export class QueryBuilder<T extends object> {
  private _collectionName: string;
  private _query: firestore.Query<firestore.DocumentData> | undefined;
  private _converter: firestore.FirestoreDataConverter<T> | undefined;
  private _collection: firestore.CollectionReference<firestore.DocumentData>;

  /**
   * The converter helper.
   * @private
   * @returns FirestoreDocument<T>
   */
  private baseConverter = {
    toFirestore: (data: Partial<T>) => data,
    fromFirestore: (snapshot: FirebaseFirestore.QueryDocumentSnapshot) =>
      snapshot.data() as T,
  };

  constructor(collectionName: string) {
    this._collectionName = collectionName;
    this._collection = firestore().collection(collectionName);
  }

  private getQuery() {
    if (!this._query) {
      this._query = this._collection;
    }

    return this._query;
  }

  public withConverter = (converter: firestore.FirestoreDataConverter<T>) => {
    this._converter = converter;
    return this;
  };

  /**
   * Creates and returns a new Query with the additional filter that documents must
   * contain the specified field and that its value should satisfy the relation constraint provided.
   */
  public wheres(
    ...where_queries: [NestedKeyOf<T>, firestore.WhereFilterOp, unknown][]
  ) {
    for (const [key, operator, value] of where_queries) {
      this.where(key, operator, value);
    }
    return this;
  }

  /**
   * Creates and returns a new Query with the additional filter that documents must
   * contain the specified field and that its value should satisfy the relation constraint provided.
   */
  public where(key: string, operator: firestore.WhereFilterOp, value: unknown) {
    this._query = this.getQuery().where(key, operator, value);
    return this;
  }

  /**
   * Creates and returns a new Query that's additionally sorted by the specified field,
   * optionally in descending order instead of ascending.
   */
  public orderBy(key: string, direction?: firestore.OrderByDirection) {
    this._query = this.getQuery().orderBy(key, direction);
    return this;
  }

  /**
   * Creates and returns a new Query that only returns the first matching documents.
   */
  public limit(limit: number) {
    this._query = this.getQuery().limit(limit);
    return this;
  }

  /**
   * Creates and returns a new Query that only returns the last matching documents.
   */
  public limitToLast(limit: number) {
    this._query = this.getQuery().limitToLast(limit);
    return this;
  }

  /**
   * Creates and returns a new Query that starts at the provided fields relative
   * to the order of the query. The order of the field values must match the order
   * of the order by clauses of the query.
   */
  public startAt(...fieldValues: unknown[]) {
    this._query = this.getQuery().startAt(...fieldValues);
    return this;
  }

  /**
   * Creates and returns a new Query that starts after the provided fields relative
   * to the order of the query. The order of the field values must match the order
   * of the order by clauses of the query.
   */
  public startAfter(...fieldValues: unknown[]) {
    this._query = this.getQuery().startAfter(...fieldValues);
    return this;
  }

  /**
   * Creates and returns a new Query that ends at the provided fields relative to the order
   * of the query. The order of the field values must match the order of the order by clauses of the query.
   */
  public endAt(...fieldValues: unknown[]) {
    this._query = this.getQuery().endAt(...fieldValues);
    return this;
  }

  /**
   * Creates and returns a new Query that ends before the provided fields relative to the order of the query.
   * The order of the field values must match the order of the order by clauses of the query.
   */
  public endBefore(...fieldValues: unknown[]) {
    this._query = this.getQuery().endBefore(...fieldValues);
    return this;
  }

  /**
   * Consume the builder and return the collection.
   */
  public build() {
    return this.getQuery().withConverter(this._converter ?? this.baseConverter);
  }

  /**
   * Executes the query and returns the results as a `QuerySnapshot`.
   *
   * @returns {Promise<T[]>} Firestore.Document[]
   */
  public async get(): Promise<firestore.QuerySnapshot<firestore.DocumentData>> {
    return this.getQuery().get();
  }

  /**
   * Query the firestore collection
   *
   * @returns {Promise<T[]>} Firestore.Document[]
   */
  public async query(): Promise<T[]> {
    return this.getQuery()
      .get()
      .then((snapshot) => {
        return snapshot.docs.map((doc) => ({
          ...(doc.data() as T),
          id: doc.id,
        }));
      });
  }
}
