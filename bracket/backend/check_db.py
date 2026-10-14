import asyncio

from bracket.database import database


async def main():
    await database.connect()

    rows = await database.fetch_all(
        """
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'match_player_stats'
        ORDER BY ordinal_position
        """
    )

    for row in rows:
        print(f"{row['column_name']}: {row['data_type']}")

    await database.disconnect()


asyncio.run(main())