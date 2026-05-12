import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

const sleep = (ms: number) =>
  new Promise((r) => setTimeout(r, ms));

export async function POST() {
  try {
    const riotHeaders = {
      "X-Riot-Token": process.env.RIOT_API_KEY!,
    };

    // ----------------------------
    // 登録済みプレイヤー一覧取得
    // ----------------------------
    const blobs = await list({
      prefix: "players/",
    });

    if (blobs.blobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No registered players",
      });
    }

    let processed = 0;

    // ----------------------------
    // 各プレイヤー処理
    // ----------------------------
    let message = "今週のKDA(ノーマル・ランク)発表！\n";
    for (const blob of blobs.blobs) {
      const res = await fetch(blob.url);
      const data = await res.json();
      const { uuid, playerName, tagId } = data;

      // 直近10試合ID取得
      const gamesRes = await fetch(
        `https://asia.api.riotgames.com/lol/match/v5/matches/by-puuid/${uuid}/ids?start=0&count=10`,
        { headers: riotHeaders }
      );

      if (!gamesRes.ok) continue;

      const gameIds: string[] = await gamesRes.json();

      let gameCount = 0;
      let sumWin = 0;
      let sumKills = 0;
      let sumDeaths = 0;
      let sumAssists = 0;

      for (const gameId of gameIds) {
        const matchRes = await fetch(
          `https://asia.api.riotgames.com/lol/match/v5/matches/${gameId}`,
          { headers: riotHeaders }
        );

        if (!matchRes.ok) continue;

        const matchData = await matchRes.json();
        const me = matchData.info.participants.find(
          (p: any) => p.puuid === uuid
        );

        if (!me) continue;

        if (me.win) sumWin++;
        sumKills += me.kills;
        sumDeaths += me.deaths;
        sumAssists += me.assists;
        gameCount++;
      }

      if (gameCount === 0) continue;

      const safeDeaths = sumDeaths === 0 ? 1 : sumDeaths;
      const averageKDA =
        (sumKills * sumAssists) / safeDeaths / gameCount;

      // ----------------------------
      // Discord 通知（UUID単位）
      // ----------------------------
      message += `
${playerName}#${tagId} の直近 ${gameCount} 試合統計
勝利数：${sumWin}
合計キル数：${sumKills}
合計デス数：${sumDeaths}
合計アシスト数：${sumAssists}
平均KDA：${averageKDA.toFixed(2)}
`;

      processed++;
      await sleep(1500);
    }

    message += "\n低いなと感じた人はもっと頑張りましょう！\n統計に参加：https://riot-discord-bot.vercel.app";

    await fetch(process.env.DISCORD_WEBHOOK_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });

    return NextResponse.json({
      success: true,
      processed,
    });
  } catch (e) {
    console.error(e);
    console.log("Error processing player data");
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}