import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPosts } from "state";
import PostWidget from "./PostWidget";
import { API_BASE_URL } from "../../utils/api";

const PostsWidget = ({ userId, isProfile = false }) => {
  const dispatch = useDispatch();
  const posts = useSelector((state) => state.posts);
  const token = useSelector((state) => state.token);

  const getPosts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        console.error("Failed to fetch posts:", response.status, response.statusText);
        return;
      }
      
      const data = await response.json();
      dispatch(setPosts({ posts: data }));
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const getUserPosts = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/posts/${userId}/posts`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (!response.ok) {
        console.error("Failed to fetch user posts:", response.status, response.statusText);
        return;
      }
      
      const data = await response.json();
      dispatch(setPosts({ posts: data }));
    } catch (error) {
      console.error("Error fetching user posts:", error);
    }
  };

  useEffect(() => {
    if (isProfile) {
      getUserPosts();
    } else {
      getPosts();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {Array.isArray(posts) && posts.map(
        ({
          _id,
          userId,
          firstName,
          lastName,
          description,
          location,
          picturePath,
          userPicturePath,
          likes,
          reactions,
          reactionCounts,
          userReaction,
          comments,
          mediaPath,
          mediaType,
          mediaSize,
          mediaPaths,
          mediaTypes,
          mediaSizes,
          pinned,
          linkPreviews,
          repostOf,
          repostComment,
        }) => (
          <PostWidget
            key={_id}
            postId={_id}
            postUserId={userId}
            name={`${firstName} ${lastName}`}
            description={description}
            location={location}
            bio={userId?.bio}
            picturePath={picturePath}
            userPicturePath={userPicturePath || (userId && userId.picturePath) || ""}
            likes={likes}
            reactions={reactions}
            reactionCounts={reactionCounts}
            userReaction={userReaction}
            comments={comments}
            mediaPath={mediaPath}
            mediaType={mediaType}
            mediaSize={mediaSize}
            mediaPaths={mediaPaths}
            mediaTypes={mediaTypes}
            mediaSizes={mediaSizes}
            isAdmin={userId?.isAdmin || false}
            pinned={pinned}
            showAddFriend={isProfile}
            linkPreviews={linkPreviews}
            repostOf={repostOf}
            repostComment={repostComment}
          />
        )
      )}
    </>
  );
};

export default PostsWidget;
