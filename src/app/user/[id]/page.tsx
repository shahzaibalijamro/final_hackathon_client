"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import React, { useEffect, useState } from 'react'
import axios from "@/config/axiosConfig"
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import Card from '@/components/Card';
import { toast, Toaster } from 'sonner';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import useRemoveUser from '@/hooks/removeUser';
import { removeAccessToken } from '@/config/redux/reducers/tokenSlice';
import { removeUser } from '@/config/redux/reducers/userSlice';

interface userState {
    user: {
        user: {
            userName: string,
            profilePicture: {
                url: string,
            }
        },
    }
}
interface singlePost {
    userId: {
        userName: string;
        profilePicture: {
            url: string
        };
    };
    _id: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    media: string;
    likes: any[];
    comments: any[];
    __v: number;
}
interface tokenState {
    token: {
        accessToken: string,
    }
}
interface User {
    userName: string,
    _id: string,
    posts: [],
    createdAt: string,
    profilePicture: {
        url: string,
    }
}

const Page = ({ params, }: { params: Promise<{ id: string }> }) => {
    const accessToken = useSelector((state: tokenState) => state.token.accessToken);
    const user = useSelector((state: userState) => state.user.user);
    const [id, setId] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [loadingVal, setLoadingVal] = useState(33);
    const [posts, setPosts] = useState<singlePost[]>([]);
    const [doesUserExist, setDoesUserExist] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const dispatch = useDispatch();
    const removeUserAndRedirect = useRemoveUser();
    const router = useRouter();
    useEffect(() => {
        (async () => {
            const resolvedParams = await params;
            setId(resolvedParams.id);
            if (!accessToken) {
                return authenticateUserState();
            }
            if (accessToken) {
                fetchPosts(resolvedParams.id);
            }
        })();
    }, [params, accessToken]);
    const authenticateUserState = async () => {
        setLoadingVal(90);
        try {
            const { data } = await axios.post("/api/v1/protected");
        } catch (error: any) {
            console.log(error);
            const errorMsg = error.response?.data.message;
            if (errorMsg === "Refresh token is required! Please log in again.") {
                router.replace("/login");
            }
        }
    }
    const fetchPosts = async (userName: string, page = 1) => {
        setPosts([]);
        try {
            const { data } = await axios(`/api/v1/posts/user`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                params: {
                    page,
                    userName
                },
            });
            console.log(data);
            if (data?.message === "You're all caught up!") {
                setCurrentUser(data.user);
                setPosts([]);
                return
            };
            const correctPosts = data.posts.map((item: singlePost) => {
                item.userId = {
                    userName: data.userName,
                    profilePicture : {
                        url: data.profilePicture.url
                    }
                };
                return item
            })
            console.log(correctPosts);
            
            setCurrentUser(data);
            setPosts(correctPosts);
        } catch (error: any) {
            console.log(error);
            const errorMsg = error.response?.data?.message;
            if (errorMsg === "User does not exist!") {
                setDoesUserExist(false);
            }
        } finally {
            setLoading(false);
        }
    }
    const calculateDays = (time: string) => {
        const createdDate = new Date(time);
        const now = Date.now();
        const diffInMs = now - createdDate.getTime();
        if (diffInMs < 1000 * 60 * 60) {
            return "Just now!";
        }
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const calc = diffInHours / 24;
        const calc2 = calc.toString()[0];
        const calc3 = diffInHours - +calc2 * 24;
        if (diffInHours === 24) {
            return '1 day ago'
        }
        if (calc > 1) {
            if (calc2 === "1") {
                if (calc3 === 0) {
                    return `${calc2} day ago`;
                } else if (calc3 === 1) {
                    return `${calc2} day and ${calc3} hour ago`;
                } else {
                    return `${calc2} day and ${calc3} hours ago`;
                }
            } else {
                if (calc3 === 0) {
                    return `${calc2} days ago`;
                } else if (calc3 === 1) {
                    return `${calc2} days and ${calc3} hour ago`;
                } else {
                    return `${calc2} days and ${calc3} hours ago`;
                }
            }
        }
        return `${diffInHours} hrs ago`
    }
    const likePost = async (id: string, index: number) => {
        if (!accessToken) {
            return toast("Unauthorized!", {
                description: `You need to log in to like a post. Please log in and try again.`,
                action: {
                    label: "Login",
                    onClick: () => router.push("/login"),
                },
            })
        }
        try {
            const { data } = await axios.post(`/api/v1/post/${id}`, {}, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })
            console.log(data);
            const confirmationMessage = data.message;
            if (confirmationMessage === "Post Unliked") {
                const { unLike } = data;
                posts[index].likes = unLike.likes;
                setPosts([...posts]);
                return toast("Post Unliked!", {
                    action: {
                        label: "Undo",
                        onClick: () => likePost(id, index),
                    },
                });
            }
            if (confirmationMessage === "Post liked") {
                const { like } = data;
                posts[index].likes = like.likes;
                setPosts([...posts]);
                return toast("Post liked!", {
                    action: {
                        label: "Undo",
                        onClick: () => likePost(id, index),
                    },
                });
            }
        } catch (error) {
            console.log(error);
        }
    }
    const commentOnPost = async (id: string, index: number) => {
        if (!(commentText || commentText.trim() !== "")) {
            return toast("Empty Comment!", {
                description: `Cannot add an empty comment.`,
                action: {
                    label: "Ok",
                    onClick: () => null,
                },
            })
        }
        if (!accessToken) {
            return toast("Unauthorized!", {
                description: `You need to log in to comment on a post. Please log in and try again.`,
                action: {
                    label: "Login",
                    onClick: () => router.push("/login"),
                },
            })
        }
        try {
            const { data } = await axios.post(`/api/v1/post/comment/${id}`, {
                text: commentText
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })
            console.log(data);
            const currentDateTime = new Date().toISOString();
            posts[index].comments.unshift({
                text: commentText,
                createdAt: currentDateTime,
                userId: { userName: user.userName }
            });
            setPosts([...posts]);
            setCommentText("");
        } catch (error) {
            console.log(error);
        }
    }
    const goToNextPage = async () => {
        if (posts.length !== 0) {
            fetchPosts(id, currentPage + 1);
            setCurrentPage(currentPage + 1)
        }
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth',
        });
    }
    const goToPreviousPage = async () => {
        if (currentPage === 1) {
            return null
        }
        fetchPosts(id, currentPage - 1);
        setCurrentPage(currentPage - 1);
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth',
        });
    }
    const logOutUser = async () => {
        try {
            const { data } = await axios.post("/api/v1/logout");
            console.log(data);
            dispatch(removeAccessToken());
            dispatch(removeUser());
            router.replace('/');
        } catch (error: any) {
            console.log(error);
            if (error.response?.status === 500) {
                return toast("Something went wrong!", {
                    description: `Please try again later!`,
                    action: {
                        label: "Retry",
                        onClick: () => logOutUser(),
                    },
                })
            }
            console.log(error);
            dispatch(removeAccessToken());
            dispatch(removeUser());
            router.replace('/');
        }
        return null;
    }
    const deleteUser = async () => {
        try {
            const { data } = await axios.delete("/api/v1/delete", {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })
            console.log(data);
            dispatch(removeAccessToken());
            dispatch(removeUser());
            router.replace('/');
        } catch (error: any) {
            console.log(error);
            const errorMsg = error.response?.data?.message;
            if (errorMsg === "Error occurred while deleting the user") {
                return toast("Could not delete User!", {
                    description: `Please try again later!`,
                    action: {
                        label: "Retry",
                        onClick: () => deleteUser(),
                    },
                })
            }
            console.log(error);
            dispatch(removeAccessToken());
            dispatch(removeUser());
            router.replace('/');
        }
    }
    return (
        <>
            <Toaster />
            {loading ? <div className='max-w-[200px] h-[80vh] mx-auto px-4 justify-center items-center mt-4 flex'><Progress value={loadingVal} /></div> : !doesUserExist ? <div className="flex items-center min-h-[85vh] px-4 py-12 sm:px-6 md:px-8 lg:px-12 xl:px-16">
                <div className="mx-auto space-y-6 text-center">
                    <div className="space-y-3">
                        <h1 className="text-4xl font-bold tracking-tighter text-[#1e40af] sm:text-5xl transition-transform hover:scale-110">404</h1>
                        <p className="text-gray-500">User does not exist!</p>
                    </div>
                    <Link
                        href="/"
                        className="inline-flex h-10 items-center rounded-md bg-[#1e40af] px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-[#3252bb] focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
                        prefetch={false}
                    >
                        Return to Home
                    </Link>
                </div>
            </div> : currentUser ? <div className='max-w-[640px] w-full mx-auto md:mt-16 mt-10'>
                <div className='flex gap-x-3 mb-3 justify-center items-center'>
                    <div>
                        <Avatar className='w-20 h-20 bg-gray-300'>
                            <AvatarImage src={currentUser.profilePicture.url} alt={`@${currentUser.userName}`} />
                            <AvatarFallback className='bg-gray-300 text-[1.5rem]'>{currentUser.userName[0] + currentUser.userName[1]}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div>
                        <div><h1 className='text-[1.4rem] font-medium'>{currentUser.userName}</h1></div>
                        <div><h1 className='text-md text-gray-600 font-medium'>Joined {calculateDays(currentUser.createdAt)}</h1></div>
                    </div>
                </div>
                {user.userName?.toString() === id?.toString() && <div className='mt-6 flex flex-col justify-center items-center'>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button className='bg-[#e40000] hover:bg-[#e4000096]'>
                                Delete account
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete your account
                                    and remove all your data including your posts from our servers.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className='bg-[#1e40af] text-white hover:text-white hover:bg-[#1e40afcc]'>Cancel</AlertDialogCancel>
                                <AlertDialogAction className='bg-[#e40000] hover:bg-[#e4000096]' onClick={deleteUser}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Button onClick={logOutUser} className='bg-[#1e40af] hover:bg-[#1e40afcc] mt-4'>Logout</Button>
                </div>}
                <div className='mt-10 text-center'>
                    <h1 className='text-[22px] font-medium'>My Posts</h1>
                    <Separator className='my-6' />
                </div>
                <div>
                    {posts.length > 0 ? posts.map((item: singlePost, index: number) => {
                        return <Card showDelete={true} key={item._id} likePost={likePost} setCommentText={setCommentText} commentOnPost={commentOnPost} index={index} item={item} />
                    }) : posts.length === 0 ? <div className='w-full justify-center items-center my-4 flex'><h1>No posts found!</h1></div> : <></>}
                </div>
                <div className='h-3 w-full'></div>
                <div>
                    {!loading && <Pagination>
                        <PaginationContent>
                            <PaginationItem className='cursor-pointer' onClick={goToPreviousPage}>
                                <PaginationPrevious />
                            </PaginationItem>
                            <PaginationItem className='cursor-pointer'>
                                <PaginationLink isActive>
                                    {currentPage}
                                </PaginationLink>
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationEllipsis />
                            </PaginationItem>
                            <PaginationItem className='cursor-pointer' onClick={goToNextPage}>
                                <PaginationNext />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>}
                </div>
                <div className='h-6 w-full'></div>
            </div> : <></>}
        </>
    )
}

export default Page