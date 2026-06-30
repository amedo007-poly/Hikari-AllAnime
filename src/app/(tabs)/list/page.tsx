"use client";

import { useEffect, useState } from "react";
import PosterCard from "../../../components/PosterCard";
import { BookmarkIcon } from "../../../components/icons";
import { getMyList, type SavedShow } from "../../../lib/mylist";

export default function ListPage() {
  const [list, setList] = useState<SavedShow[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setList(getMyList());
    setReady(true);
  }, []);

  return (
    <main className="px-[22px] md:px-8 pt-[max(20px,env(safe-area-inset-top))] md:pt-10">
      <h1 className="text-[26px] font-extrabold tracking-tight text-text">My List</h1>

      {ready && list.length === 0 ? (
        <div className="mt-24 flex flex-col items-center text-center text-muted">
          <BookmarkIcon className="h-10 w-10" />
          <p className="mt-3 text-[14px]">Nothing saved yet.</p>
          <p className="text-[12px]">Tap the bookmark on a show to add it here.</p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {list.map((s) => (
            <PosterCard key={s.id} id={s.id} name={s.name} thumbnail={s.thumbnail} score={s.score} />
          ))}
        </div>
      )}
    </main>
  );
}
