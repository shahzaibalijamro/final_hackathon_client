"use client";

import Card from '@/components/Card';
import InputForm from '@/components/InputForm'
import React, { useEffect, useRef, useState } from 'react'
import axios from "@/config/axiosConfig"
import { Progress } from '@/components/ui/progress';
import Head from 'next/head';
import { toast, Toaster } from 'sonner';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

interface tokenState {
  token: {
    accessToken: string,
  }
}
interface singlePost {
  userId: {
    userName: string;
    profilePicture: {
      url: string
    }
  };
  _id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  media: {
    url: string
};
  likes: any[];
  comments: any[];
  __v: number;
}
interface userState {
  user: {
    user: {
      userName: string
      profilePicture: {
        url: string
      }
    },
  }
}

const Home = () => {
  const accessToken = useSelector((state: tokenState) => state.token.accessToken);
  const user = useSelector((state: userState) => state.user.user);
  const [loading, setLoading] = useState(true);
  const [textInput, setTextInput] = useState("");
  const [commentText, setCommentText] = useState("");
  const [posts, setPosts] = useState<singlePost[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingVal, setLoadingVal] = useState(33);
  const router = useRouter()
  const mediaRef = useRef<HTMLInputElement | null>(null);
  const getAllPosts = async (page = 1) => {
    setPosts([]);
    setLoading(true)
    setLoadingVal(80);
    try {
      const { data } = await axios.get("/api/v1/posts", {
        params: {
          page
        },
      });
      setLoadingVal(90);
      console.log(data);
      if (data?.message === "You're all caught up!") {
        return setPosts([])
      }
      setPosts(data)
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    (async () => {
      await getAllPosts()
    })()
    console.log(process.env.NEXT_PUBLIC_API_URL, "==>");
  }, [])
  const addPost = async () => {
    if (!accessToken) {
      return toast("Unauthorized!", {
        description: `You need to log in to add a post. Please log in and try again.`,
        action: {
          label: "Login",
          onClick: () => router.push("/login"),
        },
      })
    }
    if (mediaRef.current?.files?.[0] === undefined && (!textInput || textInput.trim() === "")) {
      return toast("Error!", {
        description: `Please provide either a file or some text content before submitting.`,
        action: {
          label: "OK",
          onClick: () => console.log("ok"),
        },
      })
    };
    const formData = new FormData();
    if (mediaRef.current?.files?.[0] !== undefined) {
      formData.append("file", mediaRef.current?.files?.[0])
    }
    if (!(!textInput || textInput.trim() === "")) {
      formData.append("content", textInput)
    }
    try {
      const { data } = await axios.post("/api/v1/post", formData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const { post } = data;
      post.userId = {
        userName: user.userName,
        profilePicture: {
          url: user.profilePicture.url
        }
      }
      setPosts([post,...posts]);
    } catch (error) {
      console.log(error);
      toast("Something went wrong!", {
        description: `Please try again later.`,
        action: {
          label: "Retry",
          onClick: () => addPost(),
        },
      })
    }
  }
  const likePost = async (id: string, index: number) => {
    console.log(id)
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
      const {data} = await axios.post(`/api/v1/post/comment/${id}`,{
        text: commentText
      },{
        headers: {
          'Authorization' : `Bearer ${accessToken}`
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
    getAllPosts(currentPage+1);
    setCurrentPage(currentPage+1)
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
    getAllPosts(currentPage-1);
    setCurrentPage(currentPage-1);
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }
  return (
    <>
      <Head>
        <title>Home - My App</title>
      </Head>
      <Toaster />
      <div className='h-6 w-full'></div>
      <InputForm setTextInput={setTextInput} mediaRef={mediaRef} addPost={addPost} />
      <div className='h-6 w-full'></div>
      <div>
        {posts.length > 0 && !loading ? posts.map((item: singlePost, index: number) => {
          return <Card showDelete={false} key={item._id} likePost={likePost} setCommentText={setCommentText} commentOnPost={commentOnPost} index={index} item={item} />
        }) : posts.length === 0 && !loading ? <div className='w-full justify-center items-center my-4 flex'><h1>No posts found!</h1></div> : posts.length === 0 && loading ? <div className='max-w-[200px] mx-auto px-4 justify-center items-center mt-4 flex'><Progress value={loadingVal} /></div> : <></>}
      </div>
      <div className='h-3 w-full'></div>
      <div>
        {!loading && <Pagination>
          <PaginationContent>
            <PaginationItem className='cursor-pointer' onClick={goToPreviousPage}>
              <PaginationPrevious/>
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
              <PaginationNext/>
            </PaginationItem>
          </PaginationContent>
        </Pagination>}
      </div>
      <div className='h-6 w-full'></div>
    </>
  )
}

export default Home