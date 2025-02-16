import {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from 'kysely';

export interface MessageTable {
  id: Generated<number>;
  message: string;
  user_name: string;
  created_at: ColumnType<Date, string | undefined, never>;
}

export type Message = Selectable<MessageTable>;
export type NewMessage = Insertable<MessageTable>;
export type MessageUpdate = Updateable<MessageTable>;

// export interface PersonTable {
//   id: Generated<number>;
//   first_name: string;
//   last_name: string | null;
//   gender: 'name' | 'woman' | 'other';
//   created_at: ColumnType<Date, string | undefined, never>;
//   metadate: ColumnType<
//     {
//       login_at: string;
//       ip: string | null;
//       agent: string | null;
//       paln: 'free' | 'premium';
//     },
//     string,
//     string
//   >;
// }

// export type Person = Selectable<PersonTable>;
// export type NewPerson = Insertable<PersonTable>;
// export type PersonUpdate = Updateable<PersonTable>;

// export interface PetTable {
//   id: Generated<number>;
//   name: string;
//   owner_id: number;
//   species: 'dog' | 'cat' | 'bird';
// }

// export type Pet = Selectable<PetTable>;
// export type NewPet = Insertable<PetTable>;
// export type PetUpdate = Updateable<PetTable>;
