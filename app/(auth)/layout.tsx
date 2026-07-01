const AuthLayout = ({
    children
}: {
    children: React.ReactNode;
}) => {
    return (
        <div className="flex items-center justify-center min-h-screen w-full bg-background text-foreground">
            {children}
        </div>
    );
}

export default AuthLayout 