'use server';

import { PrismaClient, Trade } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function addTrade(formData: FormData) {
  const symbol = formData.get('symbol') as string;
  const type = formData.get('type') as string;
  const entryDate = new Date(formData.get('entryDate') as string);
  const entryPrice = parseFloat(formData.get('entryPrice') as string);
  const exitPrice = formData.get('exitPrice') ? parseFloat(formData.get('exitPrice') as string) : null;
  const quantity = parseFloat(formData.get('quantity') as string);
  const fees = formData.get('fees') ? parseFloat(formData.get('fees') as string) : null;
  const notes = formData.get('notes') as string;
  const status = formData.get('status') as string;

  await prisma.trade.create({
    data: {
      symbol,
      type,
      entryDate,
      entryPrice,
      exitPrice,
      quantity,
      fees,
      notes,
      status,
    },
  });

  revalidatePath('/');
}

export async function getTrades() {
  return await prisma.trade.findMany({
    orderBy: {
      entryDate: 'desc',
    },
  });
}

export async function getStats() {
  const trades = await prisma.trade.findMany();
  
  let totalTrades = trades.length;
  let wins = 0;
  let losses = 0;
  let totalPnL = 0;

  trades.forEach((trade: Trade) => {
    if (trade.status === 'CLOSED' && trade.exitPrice) {
      const pnl = (trade.exitPrice - trade.entryPrice) * trade.quantity - (trade.fees || 0);
      totalPnL += pnl;
      if (pnl > 0) wins++;
      else losses++;
    }
  });

  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

  return {
    totalTrades,
    wins,
    losses,
    winRate,
    totalPnL,
  };
}
