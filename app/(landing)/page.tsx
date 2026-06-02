import { Button } from "@/components/ui/button";
import Link from "next/link";

const LandingPage = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <h1 className="text-4xl font-bold">Conquer</h1>
            <p className="text-muted-foreground">AI-Powered Adaptive Interview Preparation</p>
            <div className="flex gap-4">
                <Link href="/sign-in">
                 <Button>
                    Login
                 </Button>
                </Link>
                <Link href="/sign-up">
                 <Button variant="outline">
                    Register
                 </Button>
                </Link>
            </div>
        </div>
    );
}

export default LandingPage;