import { UserButton } from "@clerk/nextjs"; 
import MobileSidebar from "@/components/mobile-sidebar";
import ThemeToggle from "@/components/theme-toggle";

const Navbar = () => {
    return (
        <div className="flex items-center p-4 justify-between border-b border-neutral-100 dark:border-neutral-850">
            <div className="md:hidden">
                <MobileSidebar />
            </div>
            <div className="flex w-full justify-end items-center gap-x-4">
                <ThemeToggle />
                <UserButton />
            </div>
        </div>
    );
}

export default Navbar; 