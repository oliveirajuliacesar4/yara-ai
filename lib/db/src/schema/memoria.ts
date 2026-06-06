import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const memoriaTable = pgTable("memoria", {
  id: serial("id").primaryKey(),
  categoria: text("categoria").notNull(),
  chave: text("chave").notNull(),
  valor: text("valor").notNull(),
  contexto: text("contexto"),
  usos: integer("usos").notNull().default(0),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertMemoriaSchema = createInsertSchema(memoriaTable).omit({ id: true, criadoEm: true, atualizadoEm: true });
export type InsertMemoria = z.infer<typeof insertMemoriaSchema>;
export type Memoria = typeof memoriaTable.$inferSelect;
