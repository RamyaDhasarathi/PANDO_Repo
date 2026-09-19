import Image from "next/image";

export default function Footer() {
  return (
    <footer className="mt-hp-8 border-t border-hp-line-soft bg-hp-ink text-white/75 pt-hp-7 pb-hp-5">
      <div className="hp-container grid grid-cols-[2fr_1fr_1fr_1fr] max-[700px]:grid-cols-2 gap-hp-6">
        <div>
          <div className="flex items-center gap-[10px] text-white font-extrabold text-[1.1rem] mb-hp-2">
            <span className="w-[28px] h-[28px] rounded-[8px] overflow-hidden flex items-center justify-center shrink-0">
              <Image src="/images/logo-mascot.png" alt="Hi Pando" width={28} height={28} className="w-full h-full object-cover" />
            </span>
            Hi Pando
          </div>
          <p className="text-[0.85rem] max-w-[280px] leading-relaxed">
            Discover, compare and enquire on homes across Dubai — no noise, no brokers in the way.
          </p>
        </div>
        <div>
          <div className="text-white font-bold text-[0.85rem] mb-hp-3">Explore</div>
          <a className="block text-[0.85rem] py-[5px] text-white/70 hover:text-white transition-colors" href="/search?purpose=sale">Buy</a>
          <a className="block text-[0.85rem] py-[5px] text-white/70 hover:text-white transition-colors" href="/search?purpose=rent">Rent</a>
          <a className="block text-[0.85rem] py-[5px] text-white/70 hover:text-white transition-colors" href="/search?type=Commercial">Commercial</a>
        </div>
        <div>
          <div className="text-white font-bold text-[0.85rem] mb-hp-3">Company</div>
          <a className="block text-[0.85rem] py-[5px] text-white/70 hover:text-white transition-colors" href="#">About Hi Pando</a>
          <a className="block text-[0.85rem] py-[5px] text-white/70 hover:text-white transition-colors" href="#">Careers</a>
          <a className="block text-[0.85rem] py-[5px] text-white/70 hover:text-white transition-colors" href="#">Contact</a>
        </div>
        <div>
          <div className="text-white font-bold text-[0.85rem] mb-hp-3">Legal</div>
          <a className="block text-[0.85rem] py-[5px] text-white/70 hover:text-white transition-colors" href="#">Privacy Policy</a>
          <a className="block text-[0.85rem] py-[5px] text-white/70 hover:text-white transition-colors" href="#">Terms of Service</a>
        </div>
      </div>
      <div className="hp-container mt-hp-6 pt-hp-4 border-t border-white/10 text-[0.78rem] flex justify-between flex-wrap gap-2">
        <span>© {new Date().getFullYear()} Hi Pando. All rights reserved.</span>
        <span>Dubai, United Arab Emirates</span>
      </div>
    </footer>
  );
}
