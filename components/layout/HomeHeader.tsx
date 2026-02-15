import { tempNavLinks } from "@/lib/constants";
import Link from "next/link";

const HomeHeader = () => {
  return (
    <nav>
      <ul className="bg-linear-to-r from-purple-900 via-violet-800 to-indigo-900 text-white flex justify-center p-4 gap-4 text-sm">
        {tempNavLinks.map((navLink) => {
          return (
            <Link key={navLink} href="">
              {navLink}
            </Link>
          );
        })}
      </ul>
    </nav>
  );
};

export default HomeHeader;
