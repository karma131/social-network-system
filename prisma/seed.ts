// @ts-nocheck
import {
  PrismaClient,
  UserRole,
  UserStatus,
  UploadType,
  PostVisibility,
  PostStatus,
  CommentStatus,
  ReactionType,
  NotificationType,
  ConversationType,
  MessageType,
  MessageStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

// Mật khẩu mẫu cho tất cả tài khoản: 123456
const PASSWORD_HASH = "$2b$10$CwTycUXWue0Thq9StjUM0uJ8xvO2Qj5vqJMX6Yc0dcz7jyW2Q9m9K";

const firstNames = [
  "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng",
  "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý", "Mai", "Tạ", "Cao", "Đinh"
];

const middleNames = [
  "Minh", "Hoàng", "Thu", "Gia", "Ngọc", "Quốc", "Mai", "Đức", "Thảo", "Thanh",
  "Anh", "Bảo", "Khánh", "Hải", "Tuấn", "Phương", "Nhật", "Quỳnh", "Hữu", "Mạnh"
];

const lastNames = [
  "Anh", "Nam", "Hà", "Huy", "Linh", "Bảo", "Phương", "Long", "Vy", "Sơn",
  "Trang", "Dũng", "Nhi", "Khoa", "Tú", "My", "Quân", "Hạnh", "Tùng", "Loan",
  "Hiếu", "Nhung", "Tâm", "Đạt", "Ngân", "Kiên", "Yến", "Phong", "Trâm", "Việt",
  "Hương", "Toàn", "Lâm", "Thủy", "Cường", "Lan", "Bình", "Nga", "Khôi", "Diệp",
  "Thắng", "Uyên", "Trí", "Ly", "Tài", "Oanh", "Nhân", "Chi", "Tín", "An"
];

const bios = [
  "Sinh viên IT, thích cà phê sữa đá, chụp ảnh phố cổ và đá bóng cuối tuần.",
  "Backend developer tập sự. Mê phở bò, bóng đá và những buổi trà đá vỉa hè.",
  "Thích du lịch Đà Lạt, đọc sách và viết vài dòng linh tinh mỗi tối.",
  "Đi làm ban ngày, đá phủi ban đêm. Fan trung thành của bún chả Hà Nội.",
  "Designer thích màu pastel, nhạc indie Việt và những chuyến đi Hội An.",
  "Sống ở Sài Gòn, thích cà phê đen đá, công nghệ và chạy bộ buổi sáng.",
  "Content creator nhỏ bé. Hay đăng ảnh đồ ăn, biển và những ngày nắng đẹp.",
  "Thích leo núi, đi phượt Ninh Bình và tìm quán cơm bình dân ngon.",
  "Yêu Hà Nội mùa thu, thích chụp ảnh film và ăn kem Tràng Tiền.",
  "Thích học ngoại ngữ, xem phim cuối tuần và đi ăn lẩu cùng bạn bè."
];

const postContents = [
  "Chiều nay Hồ Tây gió mát thật sự. Làm xong deadline CSDL rồi tự thưởng một ly bạc xỉu, cảm giác nhẹ cả người 😄",
  "Hôm nay debug Prisma cả buổi mới phát hiện sai tên biến môi trường DATABASE_URL. Bài học: đọc log kỹ trước khi nghi ngờ cả thế giới.",
  "Cuối tuần về quê ăn cơm mẹ nấu. Mâm cơm đơn giản mà ngon hơn mọi nhà hàng: cá kho, rau muống luộc, cà pháo và bát canh chua.",
  "Tối nay ai đá bóng sân Mỹ Đình thì điểm danh nhé. Thiếu 2 người, ưu tiên chạy cánh khỏe và không bỏ kèo phút cuối 😂",
  "Hội An buổi tối đẹp kiểu rất dịu. Đèn lồng, tiếng nhạc nhẹ và mùi cao lầu quanh phố cổ làm mình muốn ở lại thêm vài ngày.",
  "Sài Gòn mưa bất chợt, vừa kịp trú vào quán cà phê quen. Một buổi chiều khá hợp để ngồi đọc sách và nghe Vũ.",
  "Đà Nẵng sáng nay nắng đẹp quá. Biển xanh, trời trong, chỉ muốn tắt laptop rồi đi ăn mì Quảng ngay lập tức.",
  "Hà Nội vào thu là kiểu thời tiết làm người ta muốn đi bộ thật lâu, ghé một tiệm sách cũ rồi ăn kem Tràng Tiền.",
  "Sáng nay đi làm sớm, đường khá vắng. Tự nhiên thấy thành phố cũng có những khoảnh khắc rất dễ thương.",
  "Tối qua ngồi học NestJS với Prisma, càng học càng thấy backend thú vị nhưng cũng nhiều thứ phải nhớ thật.",
  "Một ngày bình thường nhưng vui: hoàn thành task, ăn bát bún riêu ngon và nói chuyện với vài người bạn cũ.",
  "Cuối tháng này muốn đi đâu đó gần Hà Nội, chắc Ninh Bình hoặc Tam Đảo. Ai có kinh nghiệm cho xin review nhé.",
  "Hôm nay thử tự nấu cơm, kết quả hơi mặn nhưng vẫn ăn được. Người lớn lên bằng những lần nêm sai gia vị.",
  "Đi cà phê một mình cũng hay. Có thời gian nhìn lại tuần vừa rồi và sắp xếp mấy việc còn dang dở.",
  "Mưa đầu mùa làm mình nhớ mấy ngày còn đi học, chạy xe dưới mưa rồi ghé quán bánh mì nóng gần cổng trường."
];

const commentsText = [
  "Nghe chill quá, hôm nào cho mình xin địa chỉ nhé.",
  "Đúng kiểu cuộc sống sinh viên luôn ấy 😂",
  "Bài này đọc xong thấy đói thật sự.",
  "Cố lên bạn ơi, qua deadline là đời lại đẹp.",
  "Ảnh chắc đẹp lắm, đăng thêm đi.",
  "Mình cũng từng lỗi y hệt, mất cả buổi mới tìm ra.",
  "Kèo này cho mình tham gia với nhé.",
  "Nghe hấp dẫn quá, cuối tuần triển luôn.",
  "Chuẩn luôn, mấy điều nhỏ nhỏ vậy mà vui.",
  "Đọc mà thấy nhớ Hà Nội ghê."
];

function getItem<T>(arr: T[], index: number): T {
  return arr[index % arr.length];
}

function slugifyVietnamese(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/\s+/g, "")
    .toLowerCase();
}

async function clearDatabase() {
  await prisma.conversation.updateMany({ data: { lastMessageId: null } });
  await prisma.conversationParticipant.updateMany({ data: { lastReadMessageId: null } });

  await prisma.messageRead.deleteMany();
  await prisma.messageAttachment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();

  await prisma.reaction.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.postMedia.deleteMany();
  await prisma.post.deleteMany();

  await prisma.upload.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.adminLog.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.emailVerificationToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await clearDatabase();

  const usersData = Array.from({ length: 50 }, (_, index) => {
    const fullName = `${getItem(firstNames, index)} ${getItem(middleNames, index + 3)} ${getItem(lastNames, index)}`;
    const emailName = slugifyVietnamese(fullName);

    return {
      fullName,
      email: `${emailName}${index + 1}@example.com`,
      avatarUrl: `https://example.com/avatars/user-${index + 1}.jpg`,
      coverUrl: `https://example.com/covers/vietnam-${(index % 12) + 1}.jpg`,
      bio: getItem(bios, index),
      role: index === 0 ? UserRole.ADMIN : UserRole.USER,
    };
  });

  const users = await Promise.all(
    usersData.map((user, index) =>
      prisma.user.create({
        data: {
          ...user,
          passwordHash: PASSWORD_HASH,
          status: index % 17 === 0 && index !== 0 ? UserStatus.INACTIVE : UserStatus.ACTIVE,
          emailVerifiedAt: new Date("2026-05-01T08:00:00+07:00"),
          lastLoginAt: new Date(2026, 4, 10, 8 + (index % 10), index % 60, 0),
        },
      })
    )
  );

  const admin = users[0];

  // Follow: mỗi người follow 3 người khác để dữ liệu mạng xã hội có liên kết.
  const followData: any[] = [];
  for (let i = 0; i < users.length; i++) {
    for (let step = 1; step <= 3; step++) {
      const followingIndex = (i + step * 7) % users.length;
      if (followingIndex !== i) {
        followData.push({
          followerId: users[i].id,
          followingId: users[followingIndex].id,
        });
      }
    }
  }

  await prisma.follow.createMany({
    data: followData,
    skipDuplicates: true,
  });

  // Mỗi user có 1 upload ảnh.
  const uploads = await Promise.all(
    users.map((user, index) =>
      prisma.upload.create({
        data: {
          userId: user.id,
          fileUrl: `https://example.com/posts/vietnam-post-${index + 1}.jpg`,
          fileName: `vietnam-post-${index + 1}.jpg`,
          mimeType: "image/jpeg",
          fileSize: BigInt(500000 + index * 15000),
          uploadType: UploadType.POST_IMAGE,
        },
      })
    )
  );

  // Mỗi user có 1 post.
  const posts = await Promise.all(
    users.map((user, index) =>
      prisma.post.create({
        data: {
          userId: user.id,
          content: getItem(postContents, index),
          visibility: index % 5 === 0 ? PostVisibility.FOLLOWERS : PostVisibility.PUBLIC,
          status: PostStatus.PUBLISHED,
          createdAt: new Date(2026, 4, 1 + (index % 10), 8 + (index % 12), index % 60, 0),
        },
      })
    )
  );

  await prisma.postMedia.createMany({
    data: posts.map((post, index) => ({
      postId: post.id,
      uploadId: uploads[index].id,
      fileUrl: uploads[index].fileUrl,
      fileType: "image",
      sortOrder: 1,
    })),
  });

  // Mỗi post có 3 comment từ các user khác.
  const createdComments: any[] = [];
  for (let i = 0; i < posts.length; i++) {
    for (let j = 1; j <= 3; j++) {
      const commenter = users[(i + j * 5) % users.length];
      const comment = await prisma.comment.create({
        data: {
          postId: posts[i].id,
          userId: commenter.id,
          content: getItem(commentsText, i + j),
          status: CommentStatus.ACTIVE,
          createdAt: new Date(2026, 4, 1 + (i % 10), 10 + j, (i + j) % 60, 0),
        },
      });
      createdComments.push(comment);
    }
  }

  // Reply cho 15 comment đầu.
  for (let i = 0; i < Math.min(15, createdComments.length); i++) {
    await prisma.comment.create({
      data: {
        postId: createdComments[i].postId,
        userId: posts[i % posts.length].userId,
        parentId: createdComments[i].id,
        content: "Cảm ơn nhé, hôm nào rảnh mình kể thêm 😄",
        status: CommentStatus.ACTIVE,
        createdAt: new Date(2026, 4, 12, 9, i, 0),
      },
    });
  }

  const reactionTypes = [
    ReactionType.LIKE,
    ReactionType.LOVE,
    ReactionType.HAHA,
    ReactionType.WOW,
    ReactionType.SAD,
    ReactionType.ANGRY,
  ];

  // Mỗi post có 5 reactions.
  const reactionData: any[] = [];
  for (let i = 0; i < posts.length; i++) {
    for (let j = 1; j <= 5; j++) {
      const reactor = users[(i + j * 4) % users.length];
      if (reactor.id !== posts[i].userId) {
        reactionData.push({
          userId: reactor.id,
          postId: posts[i].id,
          type: getItem(reactionTypes, i + j),
        });
      }
    }
  }

  await prisma.reaction.createMany({
    data: reactionData,
    skipDuplicates: true,
  });

  // Cập nhật số lượng comment và reaction cho từng bài viết.
  for (const post of posts) {
    const [commentCount, reactionCount] = await Promise.all([
      prisma.comment.count({ where: { postId: post.id, status: CommentStatus.ACTIVE } }),
      prisma.reaction.count({ where: { postId: post.id } }),
    ]);

    await prisma.post.update({
      where: { id: post.id },
      data: { commentCount, reactionCount },
    });
  }

  // Tạo 10 cuộc trò chuyện direct.
  const directMessages: any[] = [];
  for (let i = 0; i < 10; i++) {
    const userA = users[i];
    const userB = users[(i + 13) % users.length];

    const conversation = await prisma.conversation.create({
      data: {
        type: ConversationType.DIRECT,
        createdById: userA.id,
        createdAt: new Date(2026, 4, 10, 9, i, 0),
      },
    });

    await prisma.conversationParticipant.createMany({
      data: [
        { conversationId: conversation.id, userId: userA.id },
        { conversationId: conversation.id, userId: userB.id },
      ],
    });

    const m1 = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userA.id,
        type: MessageType.TEXT,
        content: "Tối nay rảnh không, mình hỏi chút chuyện project nhé?",
        status: MessageStatus.SEEN,
        createdAt: new Date(2026, 4, 10, 9, i, 0),
      },
    });

    const m2 = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userB.id,
        type: MessageType.TEXT,
        content: "Ok bạn, khoảng 8h mình rảnh nha.",
        status: MessageStatus.DELIVERED,
        createdAt: new Date(2026, 4, 10, 9, i + 1, 0),
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageId: m2.id },
    });

    directMessages.push(m1, m2);
  }

  // Tạo 3 nhóm chat.
  for (let g = 0; g < 3; g++) {
    const conversation = await prisma.conversation.create({
      data: {
        type: ConversationType.GROUP,
        title: ["Nhóm học CSDL", "Kèo Đà Nẵng hè này", "Team đá bóng cuối tuần"][g],
        createdById: users[g].id,
        createdAt: new Date(2026, 4, 11, 10, g, 0),
      },
    });

    const participantData = Array.from({ length: 8 }, (_, k) => ({
      conversationId: conversation.id,
      userId: users[(g * 8 + k) % users.length].id,
      isAdmin: k === 0,
    }));

    await prisma.conversationParticipant.createMany({ data: participantData });

    const messages: any[] = [];
    for (let k = 0; k < 5; k++) {
      messages.push(
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: participantData[k].userId,
            type: MessageType.TEXT,
            content: [
              "Mọi người chốt lịch giúp mình nhé.",
              "Mình đi được, nhưng ưu tiên cuối tuần.",
              "Ok, để mình tìm địa điểm trước.",
              "Nhớ đặt sớm không lại hết chỗ.",
              "Chốt vậy nha, mai mình tổng hợp lại."
            ][k],
            status: MessageStatus.SENT,
            createdAt: new Date(2026, 4, 11, 10, g * 10 + k, 0),
          },
        })
      );
    }

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageId: messages[messages.length - 1].id },
    });
  }

  // Notifications mẫu.
  const notificationsData: any[] = [];
  for (let i = 0; i < 30; i++) {
    notificationsData.push({
      userId: posts[i].userId,
      actorId: users[(i + 9) % users.length].id,
      type: i % 3 === 0 ? NotificationType.COMMENT_POST : NotificationType.LIKE_POST,
      postId: posts[i].id,
      commentId: createdComments[i]?.id,
      contentSnapshot:
        i % 3 === 0
          ? `${users[(i + 9) % users.length].fullName} đã bình luận về bài viết của bạn.`
          : `${users[(i + 9) % users.length].fullName} đã thích bài viết của bạn.`,
      isRead: i % 4 === 0,
      readAt: i % 4 === 0 ? new Date(2026, 4, 12, 8, i, 0) : null,
    });
  }

  await prisma.notification.createMany({ data: notificationsData });

  await prisma.adminLog.create({
    data: {
      adminId: admin.id,
      action: "SEED_DATA_50_USERS",
      targetType: "DATABASE",
      targetId: admin.id,
      reason: "Tạo dữ liệu mẫu phong cách người Việt Nam với 50 người dùng.",
    },
  });

  console.log("✅ Đã seed 50 người dùng và dữ liệu mạng xã hội mẫu thành công!");
  console.log("Tài khoản admin:", users[0].email, "/ 123456");
  console.log("Tài khoản user mẫu:", users[1].email, "/ 123456");
}

main()
  .catch((error) => {
    console.error("❌ Seed dữ liệu thất bại:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
