import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/database';
import { GameResult } from '@/lib/entities/GameResult';
import path from 'path';
import fs from 'fs';

async function ensureDataDir() {
  const dbPath = process.env.DATABASE_PATH
    ? path.resolve(process.cwd(), process.env.DATABASE_PATH)
    : path.resolve(process.cwd(), 'data', 'games.db');
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function GET() {
  try {
    await ensureDataDir();
    const ds = await getDataSource();
    const repo = ds.getRepository(GameResult);
    const results = await repo.find({ order: { datePlayed: 'ASC' } });
    return NextResponse.json(results);
  } catch (error) {
    console.error('GET /api/history error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDataDir();
    const body = await request.json();
    const { winner } = body;

    if (!winner || !['X', 'O', 'Draw'].includes(winner)) {
      return NextResponse.json({ error: 'Invalid winner value' }, { status: 400 });
    }

    const ds = await getDataSource();
    const repo = ds.getRepository(GameResult);

    const gameResult = repo.create({ winner });
    await repo.save(gameResult);

    return NextResponse.json(gameResult, { status: 201 });
  } catch (error) {
    console.error('POST /api/history error:', error);
    return NextResponse.json({ error: 'Failed to save result' }, { status: 500 });
  }
}
