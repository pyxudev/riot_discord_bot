import { put, head } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { playerName, tagId } = await req.json();

    if (!playerName || !tagId) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    // ----------------------------
    // Riot API 呼び出し
    // ----------------------------
    const gameName = encodeURIComponent(playerName);
    const tagLine = encodeURIComponent(tagId);

    const riotRes = await fetch(
      `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept-Language": "ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7",
          "Accept-Charset":
            "application/x-www-form-urlencoded; charset=UTF-8",
          "Origin": "https://developer.riotgames.com",
          "X-Riot-Token": process.env.RIOT_API_KEY!,
        },
      }
    );

    if (!riotRes.ok) {
      return NextResponse.json(
        { error: "Riot API error" },
        { status: 404 }
      );
    }

    const riotData = await riotRes.json();
    const uuid = riotData.puuid;

    if (!uuid) {
      return NextResponse.json(
        { error: "UUID not found" },
        { status: 404 }
      );
    }

    const filename = `players/${uuid}.json`;

    let alreadyExists = false;
    try {
      await head(filename);
      alreadyExists = true;
    } catch {
      // not exists
    }

    // ----------------------------
    // Blob 保存
    // ----------------------------
    const data = {
      uuid,
      playerName,
      tagId
    };

    await put(filename, JSON.stringify(data, null, 2), {
      access: "public",
      contentType: "application/json",
    });

    return NextResponse.json(
        {success: true, updated: alreadyExists, uuid }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}