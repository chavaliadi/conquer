import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";

const DashboardLayout = ({
    children
}: {
    children: React.ReactNode;
}) => {
    return (
     <div className="h-full relative">
         <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-neutral-50 dark:bg-[#0B0F19] border-r border-neutral-200 dark:border-neutral-900">
         <Sidebar />
        </div>
        <main className="md:pl-72">
          <Navbar />
          {children}
        </main>
     </div>
    );

}
export default DashboardLayout;