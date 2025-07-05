import * as fcl from "@onflow/fcl";

let currentQuestion = 0;
let correctAnswers = 0;

const quiz = [
  {
    question: "What is Flow?",
    options: [
      { text: "A Layer 2 on Ethereum", correct: false },
      { text: "A scalable blockchain for consumer apps", correct: true },
      { text: "An exchange", correct: false }
    ]
  },
  {
    question: "Which language does Flow use for smart contracts?",
    options: [
      { text: "Solidity", correct: false },
      { text: "Cadence", correct: true },
      { text: "Rust", correct: false }
    ]
  },
  {
    question: "Which company helped build Flow?",
    options: [
      { text: "OpenSea", correct: false },
      { text: "Dapper Labs", correct: true },
      { text: "Coinbase", correct: false }
    ]
  }
];

const dialogBox = document.createElement('div');
dialogBox.style.position = 'absolute';
dialogBox.style.bottom = '20px';
dialogBox.style.left = '50%';
dialogBox.style.transform = 'translateX(-50%)';
dialogBox.style.padding = '12px 18px';
dialogBox.style.background = 'rgba(0,0,0,0.85)';
dialogBox.style.color = '#fff';
dialogBox.style.fontFamily = 'sans-serif';
dialogBox.style.fontSize = '16px';
dialogBox.style.borderRadius = '8px';
dialogBox.style.maxWidth = '420px';
dialogBox.style.display = 'none';
dialogBox.style.zIndex = '10';
document.body.appendChild(dialogBox);

function showQuizQuestion(index) {
  const q = quiz[index];
  dialogBox.innerHTML = `<div style="margin-bottom:12px;"><strong>Mentor:</strong> ${q.question}</div>`;
  q.options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.textContent = opt.text;
    btn.style.margin = '6px';
    btn.style.padding = '10px 16px';
    btn.style.background = '#00bbff';
    btn.style.border = 'none';
    btn.style.color = '#fff';
    btn.style.fontWeight = 'bold';
    btn.style.borderRadius = '6px';
    btn.style.cursor = 'pointer';
    btn.onmouseenter = () => (btn.style.background = '#008ecc');
    btn.onmouseleave = () => (btn.style.background = '#00bbff');
    btn.onclick = () => {
      dialogBox.innerHTML = `<div style=\"margin-bottom:10px;\">You selected: <strong>${opt.text}</strong></div>`;
      setTimeout(() => {
        if (opt.correct) {
          correctAnswers++;
        }
        currentQuestion++;
        if (currentQuestion < quiz.length) {
          showQuizQuestion(currentQuestion);
        } else {
          endQuiz();
        }
      }, 800);
    };
    dialogBox.appendChild(btn);
  });
  dialogBox.style.display = 'block';
}

function endQuiz() {
  dialogBox.innerHTML = '';
  if (correctAnswers === quiz.length) {
    dialogBox.innerHTML = `
      <div><strong>Mentor:</strong> Great job! You've passed the quiz and earned a Flow T-shirt NFT!</div>
      <button id="loginBtn" style="margin-top:12px; padding:10px 16px; background:#00bbff; border:none; color:#fff; font-weight:bold; border-radius:6px; cursor:pointer;">Login with Flow</button>
    `;
    document.getElementById('loginBtn').onclick = async () => {
      const user = await fcl.authenticate();
      const snapshot = await fcl.currentUser().snapshot();
      if (snapshot.addr) {
        dialogBox.innerHTML += `
          <div style="margin-top:10px; color:#00ff99;">✅ Logged in as ${snapshot.addr}</div>
          <button style="margin-top:12px; padding:10px 16px; background:#00ff99; border:none; color:#000; font-weight:bold; border-radius:6px; cursor:pointer;" onclick="mintFlowNFT()">Mint NFT</button>
        `;
      }
    };
  } else {
    dialogBox.innerHTML = `
      <div><strong>Mentor:</strong> Almost there! Brush up on Flow and come back anytime.</div>
      <a href="https://developers.flow.com/" target="_blank" style="color:#00ffff; display:inline-block; margin-top:10px; font-weight:bold;">📘 Read Flow Docs →</a>
    `;
  }
  dialogBox.style.display = 'block';
  // Reset for next round
  currentQuestion = 0;
  correctAnswers = 0;
} 

function hideDialog() {
  dialogBox.style.display = 'none';
}

window.mintFlowNFT = async function mintFlowNFT() {
  const user = await fcl.currentUser().snapshot();
  if (!user.addr) {
    alert("Please login with your Flow wallet first.");
    return;
  }

  try {
    const txId = await fcl.mutate({
      cadence: `
        import HackathonSwag from 0x3594cc98fd019c01
        import NonFungibleToken from 0x631e88ae7f1d7c20
        import MetadataViews from 0x631e88ae7f1d7c20
        import FungibleToken from 0x9a0766d93b6608b7

        transaction {
          let minter: &HackathonSwag.NFTMinter
          let collectionRef: &{NonFungibleToken.Receiver}

          prepare(signer: auth(BorrowValue) &Account) {
            self.minter = signer
              .storage
              .borrow<&HackathonSwag.NFTMinter>(from: HackathonSwag.MinterStoragePath)
              ?? panic("Minter not found")

            let collectionData = HackathonSwag.resolveContractView(
              resourceType: nil,
              viewType: Type<MetadataViews.NFTCollectionData>()
            ) as! MetadataViews.NFTCollectionData? ?? panic("Missing collection view")

            self.collectionRef = signer
              .capabilities
              .borrow<&{NonFungibleToken.Receiver}>(collectionData.publicPath)
              ?? panic("Missing collection receiver ref")
          }

          execute {
            let royalty: [MetadataViews.Royalty] = []
            let nft <- self.minter.mintNFT(
              name: "Hackathon Swag Shirt",
              description: "Exclusive NFT for passing the quiz",
              thumbnail: "https://placekitten.com/512/512", // change this to your image URL
              royalties: royalty
            )
            self.collectionRef.deposit(token: <-nft)
          }
        }
      `,
      proposer: fcl.currentUser().authorization,
      payer: fcl.currentUser().authorization,
      authorizations: [fcl.currentUser().authorization],
      limit: 100,
    });

    dialogBox.innerHTML += `
      <div style="margin-top:10px; color:#00ff99;">🎉 Transaction submitted! <a href="https://testnet.flowscan.org/transaction/${txId}" target="_blank">View on Flowscan</a></div>
    `;
  } catch (err) {
    dialogBox.innerHTML += `<div style="color:red; margin-top:10px;">❌ Mint failed: ${err.message}</div>`;
    console.error("Minting error:", err);
  }
}

export { showQuizQuestion, hideDialog };
