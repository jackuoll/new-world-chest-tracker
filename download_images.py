import os
import asyncio
import aiohttp  # pip install aiohttp
import aiofiles  # pip install aiofiles

url_format = "https://cdn.newworldfans.com/newworldmap/6/{x}/{y}.png".format


def download_files_from_report():
    urls = []
    for x in range(0, 55 + 1):
        for y in range(0, 56 + 1):
            urls.append([x, y])

    folder = "static/map_images"
    os.makedirs(folder, exist_ok=True)
    sema = asyncio.BoundedSemaphore(200)

    async def fetch_file(x, y):
        url = url_format(x=x, y=y)
        fname = f"{x}_{abs(y-56)}.png"
        print(f"downloading {fname}")
        async with sema, aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                assert resp.status == 200
                data = await resp.read()

        async with aiofiles.open(
            os.path.join(folder, fname), "wb"
        ) as outfile:
            await outfile.write(data)

    loop = asyncio.get_event_loop()
    tasks = [loop.create_task(fetch_file(x, y)) for x, y in urls]
    loop.run_until_complete(asyncio.wait(tasks))
    loop.close()


download_files_from_report()