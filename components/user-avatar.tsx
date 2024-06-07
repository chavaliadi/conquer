// import { useUser } from "@clerk/nextjs"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";



// export const UserAvatar = () => {
//     const { user } = useUser();
//     return (
//         <Avatar className="h-8 w-8">
//             <AvatarImage src={user?.profileImageUrl} />
//             <AvatarFallback>
//                 {user?.firstName?.charAt(0)}
//                 {user?.lastName?.charAt(0)}
//             </AvatarFallback>
//         </Avatar>
//     );
// };


import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const UserAvatar = () => {
    const { user } = useUser();

    console.log(user);

 
    const profileImageUrl = user?.imageUrl; 

    return (
        <Avatar className="h-8 w-8">
            {profileImageUrl ? (
                <AvatarImage src={profileImageUrl} alt="User Profile Image" />
            ) : (
                <AvatarFallback>
                    {user?.firstName?.charAt(0) ?? ''}
                    {user?.lastName?.charAt(0) ?? ''}
                </AvatarFallback>
            )}
        </Avatar>
    );
};
