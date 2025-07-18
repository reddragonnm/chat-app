import UserStatusIndicator from "@/components/UserStatusIndicator";

const ChatList = ({ userId, chatListData, onChatSelect }) => {
  return (
    <>
      <ul>
        {Object.values(chatListData)
          .filter((user) => user.user_id !== userId)
          .map((user) => (
            <li key={user.user_id}>
              <img
                src={
                  user.avatarUrl ||
                  `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${user.username}`
                }
                width="50"
                height="50"
                alt=""
              />

              <button onClick={() => onChatSelect(user.user_id)}>
                {user.username}
              </button>

              <UserStatusIndicator userId={user.user_id} />
            </li>
          ))}
      </ul>
    </>
  );
};

export default ChatList;
