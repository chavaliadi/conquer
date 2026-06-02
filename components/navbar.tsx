import { UserButton } from "@clerk/nextjs"; 
import MobileSidebar from "@/components/mobile-sidebar";

const Navbar = () => {
    return (
        <div className="flex itmes-center p-4">
            <MobileSidebar />
            <div className="flex w-full justify-end">
                <UserButton />
            </div>
        </div>
    );
}

export default Navbar; 