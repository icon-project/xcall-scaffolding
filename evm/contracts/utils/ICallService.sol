// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0;

interface ICallService {
    function sendCallMessage(
        string memory _to,
        bytes memory _data,
        bytes memory _rollback
        /*
        string[] memory sources,
        string[] memory destinations
        */
    ) external payable returns (
        uint256
    );
}
