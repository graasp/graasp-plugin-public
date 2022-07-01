import { DatabaseTransactionConnection as TrxHandler, sql } from 'slonik';

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
  async isPublic(item: Item, transactionHandler: TrxHandler): Promise<boolean> {
    return transactionHandler
      .oneFirst<string>(
        sql`
        SELECT count(*) FROM item_tag
        WHERE tag_id = ${this.tagId} AND item_path @> ${item.path}
      `,
      )
      .then((count) => parseInt(count, 10) >= 1);
  }
}
