// global
import { sql, DatabaseTransactionConnectionType as TrxHandler } from 'slonik';
import { Item } from 'graasp';

export class PublicItemService {
  private tagId: string;

  constructor(publicItemTagId: string) {
    this.tagId = publicItemTagId;
  }

  /**
   * Check if item has public tag.
   * @param item Item
   * @param transactionHandler Database transaction handler
   */
  async hasPublicTag(item: Item, transactionHandler: TrxHandler): Promise<boolean> {
    return transactionHandler
      .oneFirst<string>(
        sql`
        SELECT count(*) FROM item_tag
        WHERE tag_id = ${this.tagId} AND item_path @> ${item.path}
      `,
      )
      .then((count) => parseInt(count, 10) >= 1);
  }

  /**
   * Check if item has public tag.
   * @param item Item
   * @param transactionHandler Database transaction handler
   */
  async getPublicItemsByTag(
    tagId: string,
    transactionHandler: TrxHandler,
  ): Promise<readonly Item[]> {
    return transactionHandler
      .query<Item>(
        sql`
        SELECT * from item WHERE path IN (
          SELECT item_path from item_tag 
          WHERE tag_id = ${this.tagId} OR tag_id = ${tagId}
          GROUP BY item_path
          HAVING COUNT(*)>=2
        )
    `,
      )
      .then(({ rows }) => rows);
  }
}
