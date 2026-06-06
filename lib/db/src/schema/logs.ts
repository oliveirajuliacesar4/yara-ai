import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const logsTable = pgTable("logs_geracao", {
  id: serial("id").primaryKey(),
  projetoId: integer("projeto_id").notNull(),
  etapa: text("etapa").notNull(),
  status: text("status").notNull(),
  mensagem: text("mensagem").notNull(),
  duracao: integer("duracao"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLogSchema = createInsertSchema(logsTable).omit({ id: true, criadoEm: true });
export type InsertLog = z.infer<typeof insertLogSchema>;
export type Log = typeof logsTable.$inferSelect;
