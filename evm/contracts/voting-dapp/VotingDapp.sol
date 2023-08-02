// contracts/VotingDapp.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title VotingDapp
 * @dev Implements the voting dapp contract.
 */
contract VotingDapp {
  struct Votes {
    uint256 countOfYes;
    uint256 countOfNo;
  }
  Votes public votes;
  address private callSvc;
  int public votesCap = 0;

  /**
     @notice Constructor
     @param _callService The address of the contract that will only be allowed to call the handleCallMessage function
     @param _votesCap The max amount of votes that can be casted
   */
  constructor(address _callService, int _votesCap) {
    votes.countOfYes = 0;
    votes.countOfNo = 0;
    callSvc = _callService;
    votesCap = _votesCap;
  }

  /**
     @notice Returns the votes struct.
     @return The votes struct
   */
  function getVotes() public view returns (uint256, uint256) {
    return (votes.countOfYes, votes.countOfNo);
  }

  /**
     @notice Returns the max amount of votes that can be casted.
     @return The votesCap
   */
  function getVotesCap() public view returns (int) {
    return votesCap;
  }

  /**
     @notice Adds a yes vote to the votes struct.
   */
  function addYesVote() internal {
    if (int(votes.countOfYes +  votes.countOfNo) + 1 > votesCap) {
      revert("VotesCapReached");
    }
    votes.countOfYes++;
  }

  /**
     @notice Adds a no vote to the votes struct.
   */
  function addNoVote() internal {
    if (int(votes.countOfYes +  votes.countOfNo) + 1 > votesCap) {
      revert("VotesCapReached");
    }
    votes.countOfNo++;
  }

  /**
     @notice Modifier that only allows the callSvc to call the function.
   */
  modifier onlyCallService() {
      require(msg.sender == callSvc, "OnlyCallService");
      _;
  }

  /**
     @notice Returns the address of the Call Message Service.
     @dev the callSvc is the only contract that can call the handleCallMessage function.
     @return  The address of the callSvc
   */
  function getCallService() public view returns (address) {
      return callSvc;
  }

  /**
     @notice Compares two strings
     @param _base The first string
     @param _value The second string
     @return True if the strings are equal, false otherwise
   */
  function compareTo(
      string memory _base,
      string memory _value
  ) internal pure returns (bool) {
      if (
          keccak256(abi.encodePacked(_base)) ==
          keccak256(abi.encodePacked(_value))
      ) {
          return true;
      }
      return false;
  }

  /**
     @notice Handles the call message received from the source chain.
     @dev Only calleable from the callSvc which is the xCall contract.
     @param _from The BTP address of the caller on the source chain
     @param _data The calldata delivered from the caller
   */
  function handleCallMessage(
      string calldata _from,
      bytes calldata _data
  ) external {
      string memory msgData = string(_data);
      emit MessageReceived(_from, msgData);
      if (compareTo("voteYes", msgData)) {
          addYesVote();
      } else if (compareTo("voteNo", msgData)) {
          addNoVote();
      } else {
        revert("InvalidMessage");
      }
  }

  /**
     @notice Handles the reply message received from the source chain.
     @dev Only called from the Call Message Service.
     @param _from The BTP address of the caller on the source chain
     @param _msgData The cross chain data sent
   */
  event MessageReceived(
      string _from,
      string _msgData
  );
}
